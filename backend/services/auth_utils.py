from passlib.context import CryptContext

# Institutional security context using bcrypt
# 12 rounds of salts for production-grade resistance
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    """Returns the cryptographic hash of a plain-text password."""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies that a plain-text password matches its cryptographic hash."""
    return pwd_context.verify(plain_password, hashed_password)
