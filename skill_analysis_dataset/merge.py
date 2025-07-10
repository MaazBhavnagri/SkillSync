import pandas as pd

df1 = pd.read_csv("data/pushups_angles.csv")
df2 = pd.read_csv("data/pushups_angles_bad.csv")

combined_df = pd.concat([df1, df2], ignore_index=True)
combined_df.to_csv("data/pushups_combined.csv", index=False)
