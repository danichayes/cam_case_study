"""One time script for uploading files to db."""
import pandas as pd
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base, Pool, Loan
from dotenv import load_dotenv
from decimal import Decimal, ROUND_HALF_UP
import os

abbrev_to_state = {
    "AL": "Alabama",
    "AK": "Alaska",
    "AZ": "Arizona",
    "AR": "Arkansas",
    "CA": "California",
    "CO": "Colorado",
    "CT": "Connecticut",
    "DE": "Delaware",
    "FL": "Florida",
    "GA": "Georgia",
    "HI": "Hawaii",
    "ID": "Idaho",
    "IL": "Illinois",
    "IN": "Indiana",
    "IA": "Iowa",
    "KS": "Kansas",
    "KY": "Kentucky",
    "LA": "Louisiana",
    "ME": "Maine",
    "MD": "Maryland",
    "MA": "Massachusetts",
    "MI": "Michigan",
    "MN": "Minnesota",
    "MS": "Mississippi",
    "MO": "Missouri",
    "MT": "Montana",
    "NE": "Nebraska",
    "NV": "Nevada",
    "NH": "New Hampshire",
    "NJ": "New Jersey",
    "NM": "New Mexico",
    "NY": "New York",
    "NC": "North Carolina",
    "ND": "North Dakota",
    "OH": "Ohio",
    "OK": "Oklahoma",
    "OR": "Oregon",
    "PA": "Pennsylvania",
    "RI": "Rhode Island",
    "SC": "South Carolina",
    "SD": "South Dakota",
    "TN": "Tennessee",
    "TX": "Texas",
    "UT": "Utah",
    "VT": "Vermont",
    "VA": "Virginia",
    "WA": "Washington",
    "WV": "West Virginia",
    "WI": "Wisconsin",
    "WY": "Wyoming"
}

load_dotenv()



ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
if ENVIRONMENT == "production":
    DATABASE_URL = os.getenv("INTERNAL_DATABASE_URL")
else:
    DATABASE_URL = os.getenv("EXTERNAL_DATABASE_URL")


engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
session = SessionLocal()


sheet1 = pd.read_excel("Case Study.xlsx")
sheet2 = pd.read_csv("Case Study 2.csv")


sheet1.rename(columns={
    "Loan Number": "id",
    "Pool Name": "pool_name",
    "Origination Date": "loan_date",
    "Original Principal": "original_principal",
    "Rate": "interest_rate",
    "Payment": "payment",
    "Current Principal": "current_principal",
    "Borrower": "borrower_full_name",
    "Address": "address",
    "City": "city",
    "State": "state",
    "Zip Code": "zip",
    "Prop Value": "property_value"
}, inplace=True)

sheet1[["borrower_first_name", "borrower_last_name"]] = sheet1["borrower_full_name"].str.split(pat=" ", n=1, expand=True)



sheet2.rename(columns={
    "Loan ID": "id",
    "Pool": "pool_name",
    "Note Date": "loan_date",
    "Original Balance": "original_principal",
    "Interest": "interest_rate",
    "P&I PMT": "payment",
    "UPB": "current_principal",
    "Appraisal": "property_value",
    "First Name": "borrower_first_name",
    "Last Name": "borrower_last_name",
    "House number": "house_number",
    "Street": "street",
    "City": "city",
    "State": "state",
    "Zip": "zip"
}, inplace=True)


sheet2["address"] = sheet2["house_number"].astype(str) + " " + sheet2["street"]

# Convert and clean data
def parse_money(val):
    try:
        return Decimal(str(val).replace(",", "").strip())
    except:
        return None

def parse_percent(val):
    try:
        return (Decimal(str(val).replace('%', '').strip())).quantize(Decimal("0.0001"), rounding=ROUND_HALF_UP) #Handles float point precision issues
    except:
        return None

sheet1["interest_rate"] = sheet1["interest_rate"].apply(parse_percent)
sheet2["interest_rate"] = sheet2["interest_rate"].apply(parse_percent)


for col in ["original_principal", "payment", "current_principal", "property_value"]:
    sheet1[col] = sheet1[col].apply(parse_money)
    sheet2[col] = sheet2[col].apply(parse_money)

sheet1["loan_date"] = pd.to_datetime(sheet1["loan_date"]).dt.date
sheet2["loan_date"] = pd.to_datetime(sheet2["loan_date"]).dt.date
sheet1["pool_name"] = sheet1["pool_name"].str.upper()
sheet2["pool_name"] = sheet2["pool_name"].str.upper()
sheet1['borrower_last_name'] = sheet1['borrower_last_name'].str.upper()
sheet1['borrower_first_name'] = sheet1['borrower_first_name'].str.upper()
sheet2['borrower_last_name'] = sheet2['borrower_last_name'].str.upper()
sheet2['borrower_first_name'] = sheet2['borrower_first_name'].str.upper()
sheet1['state'] = sheet1['state'].map(abbrev_to_state)



combined = pd.concat([
    sheet1[[
        "id", "pool_name", "loan_date", "original_principal", "interest_rate",
        "payment", "current_principal", "borrower_first_name", "borrower_last_name",
        "address", "city", "state", "zip", "property_value"
    ]],
    sheet2[[
        "id", "pool_name", "loan_date", "original_principal", "interest_rate",
        "payment", "current_principal", "borrower_first_name", "borrower_last_name",
        "address", "city", "state", "zip", "property_value"
    ]]
])


pool_name_to_id = {}
unique_pools = combined["pool_name"].dropna().unique()

for name in unique_pools:
    pool = Pool(pool_name=name)
    session.add(pool)
    session.flush()  # Get ID before commit
    pool_name_to_id[name] = pool.id # Map pool name to id for loan insertion.


for _, row in combined.iterrows():
    loan = Loan(
        id=int(row["id"]),
        pool_id=pool_name_to_id.get(row["pool_name"]),
        loan_date=row["loan_date"],
        original_principal=row["original_principal"],
        interest_rate=row["interest_rate"],
        payment=row["payment"],
        current_principal=row["current_principal"],
        borrower_first_name=row["borrower_first_name"],
        borrower_last_name=row["borrower_last_name"],
        address=row["address"],
        city=row["city"],
        state=row["state"],
        zip=row["zip"],
        property_value=row["property_value"]
    )
    session.add(loan)


session.commit()
session.close()


