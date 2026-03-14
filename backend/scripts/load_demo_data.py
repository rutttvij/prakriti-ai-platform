from app.db.demo_seed import run_demo_seed


if __name__ == "__main__":
    summary = run_demo_seed()
    print("Demo seed completed successfully")
    print(f"Organization: {summary.organization_slug}")
    print(f"City: {summary.city_name}")
    print("Demo Accounts:")
    for email in summary.account_emails:
      print(f"  - {email}")
    print(f"Password: {summary.password_hint}")
