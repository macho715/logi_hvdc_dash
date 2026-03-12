import pandas as pd

file_path = r'C:\Users\minky\Downloads\HVDC DASH\hvdc-dashboard\HVDC STATUS_1.xlsx'

df = pd.read_excel(file_path, sheet_name='시트1')

# Row 31 in 1-based index is index 30 in 0-based DataFrame
# Or if header is row 0, then row 31 is index 29 or 30 depending on how pandas reads it.
# Let's check index 29, 30, 31 just to be sure.

print("--- Checking Rows around 31 ---")
for i in range(29, 33):
    print(f"\nRow {i+1} (Index {i}):")
    row = df.iloc[i]
    # Print only non-null values to reduce noise
    for col, val in row.items():
        if pd.notna(val):
            print(f"  {col}: {val}")
