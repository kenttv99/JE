from sqlalchemy.orm import Session
from init_db import Role, User

def init_roles(db: Session):
    if db.query(Role).count() == 0:
        roles = [
            Role(name="admin", description="Administrator role"),
            Role(name="trader", description="Trader role"),
            Role(name="user", description="Regular user role"),
        ]
        db.add_all(roles)
        db.commit()

def init_users(db: Session):
    if db.query(User).count() == 0:
        admin_role = db.query(Role).filter(Role.name == "admin").first()
        example_user = User(
            email="admin@example.com",
            password_hash="hashed_password_placeholder",
            role_id=admin_role.id,
            is_superuser=True
        )
        db.add(example_user)
        db.commit()

def init_data(db: Session):
    init_roles(db)
    init_users(db)