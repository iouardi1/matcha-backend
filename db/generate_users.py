import psycopg2
from faker import Faker
import random
import math
import requests
import time
from geopy.distance import geodesic

# conn = psycopg2.connect(
#     dbname="matcha",     
#     user="newuser",     
#     password="password", 
#     host="localhost",    
#     port="5432"          
# )
# cur = conn.cursor()

# Create a Faker instance
faker = Faker()

PIXABAY_API_KEY = '46466187-6124fe7644789b0d1853d93ae'
PIXABAY_API_URL = 'https://pixabay.com/api/'



def fetch_random_profile_photo():
    try:
        # Search for 'person' images
        response = requests.get(
            PIXABAY_API_URL,
            params={
                'key': PIXABAY_API_KEY,
                'q': random.choice(['portrait', 'person', 'man', 'woman']),  # Search for human-related terms
                'image_type': 'photo',
                'category': 'people',  # Category filter for people
                'per_page': 5  # Fetch a few images to choose from
            }
        )
        data = response.json()
        if data['hits']:
            return random.choice(data['hits'])['webformatURL']
        else:
            print("No human images found")
            return None
    except Exception as e:
        print(f"Error fetching image: {e}")
        return None



def generate_random_location_within_radius(center_lat, center_lon, radius_km=500):
    # Convert radius from kilometers to degrees (approx.)
    radius_deg = radius_km / 111.32  # 1 degree of latitude is approximately 111.32 km

    # Generate random latitude and longitude within the radius
    lat_offset = random.uniform(-radius_deg, radius_deg)
    lon_offset = random.uniform(-radius_deg, radius_deg) / math.cos(math.radians(center_lat))

    return f"{round(center_lat + lat_offset, 6)},{round(center_lon + lon_offset, 6)}"

# Function to generate a central point and generate users around it
def insert_users_with_photos_and_locations(user_count):
    # Establish a database connection
    conn = psycopg2.connect(
        dbname="matcha",     
        user="newuser",     
        password="password", 
        host="localhost",    
        port="5432"    
    )
    cur = conn.cursor()

    # Generate a random central location
    center_lat = round(random.uniform(-90.0, 90.0), 6)
    center_lon = round(random.uniform(-180.0, 180.0), 6)

    for _ in range(user_count):
        firstname = faker.first_name()
        lastname = faker.last_name()
        email = faker.unique.email()  # Ensure unique emails
        password = faker.password()
        aboutme = faker.sentence()
        username = faker.user_name()
        birthday = faker.date_of_birth(minimum_age=18, maximum_age=65)
        gender_id = random.choice([1, 2])  # Adjust based on your gender IDs
        
        # Generate location within 500 km radius of the central point
        location = generate_random_location_within_radius(center_lat, center_lon)

        try:
            # Insert user
            cur.execute(
                """
                INSERT INTO users (firstname, lastname, email, password, aboutme, username, birthday, gender_id, location, verified_account, setup_finished)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, true, true)
                RETURNING id
                """,
                (firstname, lastname, email, password, aboutme, username, birthday, gender_id, location)
            )
            user_id = cur.fetchone()[0]

            # Insert user photo
            photo_url = fetch_random_profile_photo()
            cur.execute(
                """
                INSERT INTO user_photo (user_id, photo_url, upload_date, active)
                VALUES (%s, %s, NOW(), true)
                """,
                (user_id, photo_url)
            )

            # Insert interested_in_gender (opposite gender)
            opposite_gender_id = 1 if gender_id == 2 else 2  # Assuming 1 = Male, 2 = Female
            cur.execute(
                """
                INSERT INTO interested_in_gender (user_id, gender_id)
                VALUES (%s, %s)
                """,
                (user_id, opposite_gender_id)
            )

        except psycopg2.errors.UniqueViolation:
            print(f"Duplicate email found: {email}. Skipping.")
        except Exception as e:
            print(f"An error occurred: {e}")

    # Commit changes and close the connection
    conn.commit()
    cur.close()
    conn.close()

# Call the function to insert users
insert_users_with_photos_and_locations(500)

print("500 users with photos, interested_in_gender, and locations inserted successfully.")