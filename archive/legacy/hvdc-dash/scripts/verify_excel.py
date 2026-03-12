import pandas as pd
import os

file_path = r'C:\Users\minky\Downloads\HVDC DASH\hvdc-dashboard\HVDC STATUS_1.xlsx'

try:
    df = pd.read_excel(file_path, sheet_name='시트1')
    print("Columns found:")
    for col in df.columns:
        print(f" - {col}")
except Exception as e:
    print(f"Error reading file: {e}")
