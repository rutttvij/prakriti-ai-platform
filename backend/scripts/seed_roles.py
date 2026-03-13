from app.utils.seed_roles import seed_roles_if_ready


if __name__ == "__main__":
    seed_roles_if_ready()
    print("Role seeding completed (if roles table exists).")
