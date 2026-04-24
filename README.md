# .env dosyası örnegi
   ```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=sifre
DB_NAME=hospital_management
JWT_SECRET=your_jwt_secret_key
PORT=5000
SMTP_USER=systemonlinehospital@gmail.com
SMTP_PASS=cpkvlxqwgarxrgne
EMAIL_VERIFICATION_ENABLED=true
   ```




# Hospital Management System

A web-based hospital management system with patient and doctor interfaces.

## Data Structure

### Users
The system supports different user roles:
- Patient
- Doctor
- Receptionist
- Admin

### API Endpoints

#### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user details

#### Doctors
- `GET /api/doctors` - Get all doctors
- `GET /api/doctors/:id` - Get doctor by ID
- `GET /api/doctors/:id/availability` - Get doctor availability for scheduling

#### Appointments
- `GET /api/appointments` - Get user appointments
- `POST /api/appointments` - Create a new appointment
- `PUT /api/appointments/:id` - Update appointment details
- `DELETE /api/appointments/:id` - Cancel an appointment

#### Medical Records (Patient)
- `GET /api/medical-records/records` - Get patient medical records
- `GET /api/medical-records/medications` - Get patient medications
- `GET /api/medical-records/allergies` - Get patient allergies
- `GET /api/medical-records/vaccinations` - Get patient vaccinations

#### Users Management
- `GET /api/users` - Get all users (admin only)
- `PUT /api/users/:id` - Update user details
- `PUT /api/users/:id/role` - Update user role (admin only)

## Getting Started

### Prerequisites
- Node.js (v14+)
- MySQL

### Installation

1. Clone the repository
2. Install server dependencies
   ```
   cd server
   npm install
   ```

3. Install client dependencies
   ```
   cd client
   npm install
   ```

4. Configure environment variables
   ```
   cp server/.env.example server/.env
   ```
   Update the values in .env file

5. Initialize the database
   ```
   cd server
   npm run init-db
   ```

6. Create initial users
   ```
   cd server
   node scripts/create-admin.js
   node scripts/create-patient.js
   node scripts/create-doctors.js
   ```

### Running the Application

1. Start the server:
   ```
   cd server
   npm start
   ```

2. Start the client:
   ```
   cd client
   npm start
   ```

### Default Users

#### Admin
- Username: admin
- Password: admin123

#### Patient
- Username: patient
- Password: patient123

#### Doctors
- Username: jsmith
- Password: doctor123

- Username: eclark
- Password: doctor123

- Username: mwilson
- Password: doctor123

## Implementation Notes

1. The system currently uses real doctors data from the database.
2. API endpoints are secured with JWT authentication.
3. For medical records, medications, allergies, and vaccinations, the API endpoints are prepared but return empty arrays as they would be populated from a real database in a production environment.
