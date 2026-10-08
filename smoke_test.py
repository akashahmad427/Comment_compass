"""Smoke test for the Comment Compass safety fixes. Uses only the Python standard library.

Run from your project folder (where docker-compose.yml is):
    EMAIL_BASE=you@gmail.com python3 smoke_test.py
"""
import json, os, re, subprocess, sys, time, urllib.request, urllib.error, uuid

BASE = os.getenv("BASE", "http://localhost:8000")
EMAIL_BASE = os.getenv("EMAIL_BASE", "")
OTP_CMD = os.getenv("OTP_CMD", "docker compose logs --no-log-prefix --tail 300 backend")
if "@" not in EMAIL_BASE:
    sys.exit("Set EMAIL_BASE to your own email, e.g.  EMAIL_BASE=you@gmail.com python3 smoke_test.py")

results = []

def call(method, path, body=None, token=None):
    req = urllib.request.Request(BASE + path, method=method,
                                 data=json.dumps(body).encode() if body is not None else None)
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return r.status, json.loads(r.read() or b"{}")
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read() or b"{}")
        except Exception:
            return e.code, {}

def check(name, ok, detail=""):
    results.append(ok)
    print(("PASS  " if ok else "FAIL  ") + name + ("" if ok else f"   -> {detail}"))

def new_email():
    user, domain = EMAIL_BASE.split("@", 1)
    return f"{user}+cc{uuid.uuid4().hex[:6]}@{domain}"

def get_otp(key):
    time.sleep(1.5)
    out = subprocess.run(OTP_CMD, shell=True, capture_output=True, text=True).stdout
    found = re.findall(r"\[DEV OTP\] (\S+) -> (\d{6})", out)
    codes = [c for k, c in found if k == key]
    if not codes:
        sys.exit(f"Could not find the code for {key} in the backend logs. Is ENV=production set? (codes only print in development)")
    return codes[-1]

def wrong_code(real):
    return "000000" if real != "000000" else "111111"

PW = "TestPass12345"

# 1. register must not work without a verified code
a = new_email()
s, j = call("POST", "/auth/register", {"email": a, "password": PW})
check("1. Register without verifying the email is rejected", s == 400, f"got {s} {j}")

# 2/4. send code + cooldown
s, _ = call("POST", "/auth/send-otp", {"email": a})
check("   Sending a code works", s == 200, f"got {s}")
s, _ = call("POST", "/auth/send-otp", {"email": a})
check("4. Immediate resend is blocked (cooldown)", s == 429, f"got {s}")

# 3. wrong code, then right code
code = get_otp(f"signup:{a}")
s, _ = call("POST", "/auth/verify-otp", {"email": a, "otp": wrong_code(code)})
check("3. A wrong code is rejected", s == 400, f"got {s}")
s, _ = call("POST", "/auth/register", {"email": a, "password": PW})
check("   Register still blocked after a wrong code", s == 400, f"got {s}")
s, _ = call("POST", "/auth/verify-otp", {"email": a, "otp": code})
check("2. The correct code is accepted", s == 200, f"got {s}")
s, j = call("POST", "/auth/register", {"email": a, "password": PW})
check("   Register works after verifying", s == 201 and "token" in j, f"got {s} {j}")
s, _ = call("POST", "/auth/register", {"email": a, "password": PW})
check("   Registering the same email twice is rejected", s == 409, f"got {s}")
s, j = call("POST", "/auth/login", {"email": a, "password": PW})
check("   Login works", s == 200, f"got {s}")
token = j.get("token")

# 3b. brute-force lockout
b = new_email()
call("POST", "/auth/send-otp", {"email": b})
real_b = get_otp(f"signup:{b}")
last = (0, {})
for _ in range(5):
    last = call("POST", "/auth/verify-otp", {"email": b, "otp": wrong_code(real_b)})
check("3. Five wrong codes lock the code out", "Too many" in str(last[1]), f"got {last}")
s, _ = call("POST", "/auth/verify-otp", {"email": b, "otp": real_b})
check("   The correct code no longer works after lockout", s == 400, f"got {s}")

# 6. password reset
s, _ = call("POST", "/auth/reset-password", {"email": a, "new_password": "NewPass12345"})
check("6. Reset without a verified code is rejected", s == 400, f"got {s}")
call("POST", "/auth/forgot-password", {"email": a})
rcode = get_otp(f"reset:{a}")
s, _ = call("POST", "/auth/verify-reset-otp", {"email": a, "otp": rcode})
check("   Reset code accepted", s == 200, f"got {s}")
s, _ = call("POST", "/auth/reset-password", {"email": a, "new_password": "NewPass12345"})
check("   Password reset works", s == 200, f"got {s}")
s, _ = call("POST", "/auth/login", {"email": a, "password": "NewPass12345"})
check("   Login works with the new password", s == 200, f"got {s}")

# 11. login rate limit: 8 wrong passwords allowed, the 9th attempt is blocked
ghost = new_email()
codes = [call("POST", "/auth/login", {"email": ghost, "password": "WrongPass123"})[0] for _ in range(9)]
check("11. Login is blocked after 8 wrong passwords", codes[:8] == [401] * 8 and codes[8] == 429, f"got {codes}")

# 10. failed analyses must not use up the daily limit
s, _ = call("POST", "/analyses", {"url": "not a youtube link"}, token)
check("   Invalid link is rejected with 400", s == 400, f"got {s}")
blocked = False
for i in range(7):                       # more than the default limit of 5
    vid = "zz" + uuid.uuid4().hex[:9]    # 11 characters, does not exist on YouTube
    s, j = call("POST", "/analyses", {"url": vid}, token)
    if s == 429:
        blocked = True
        break
    for _ in range(40):                  # wait until this analysis finishes
        time.sleep(1)
        s2, j2 = call("GET", f"/analyses/{j.get('id')}", None, token)
        if j2.get("status") in ("done", "failed"):
            break
check("10. Seven failed analyses in a row never hit the daily limit", not blocked, "got a 429 limit error")

print()
print(f"{sum(results)} of {len(results)} checks passed")
sys.exit(0 if all(results) else 1)