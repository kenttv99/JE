import requests


headers = {"Content_Type": "application/json"}
update_rates = requests.post("http://localhost:8000/api/update_rates/", headers=headers)