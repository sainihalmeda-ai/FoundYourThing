"""Campus lost & found constants."""

# Only high-value items — no pens, pencils, or small stationery.
VALUABLE_CATEGORIES: dict[str, str] = {
    "mobile_phone": "Mobile Phone",
    "laptop_tablet": "Laptop / Tablet",
    "watch": "Watch",
    "wallet": "Wallet",
    "id_card": "ID Card",
    "bag_backpack": "Bag / Backpack",
    "keys": "Keys",
    "earbuds_headphones": "Earbuds / Headphones",
    "spectacles": "Spectacles",
    "other_valuable": "Other Valuable",
}

CAMPUS_LOCATIONS = [
    "Canteen",
    "Library",
    "Main Block",
    "CS Department",
    "EE Department",
    "Mechanical Block",
    "Sports Ground",
    "Hostel",
    "Parking",
    "Auditorium",
    "Other",
]

# Privacy disclosure stages
DISCLOSURE_PUBLIC = "public"       # VTU ID only
DISCLOSURE_MATCH = "match"         # VTU ID + match score
DISCLOSURE_CLAIM = "claim"         # Name + department on claim request
DISCLOSURE_CONNECTED = "connected"  # Full contact after mutual consent
