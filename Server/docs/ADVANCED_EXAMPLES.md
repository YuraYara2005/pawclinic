# PawClinic Backend - Advanced API Usage Examples

## Real-World Scenarios & Code Examples

---

## 🏥 Scenario 1: Emergency Visit Management

### Use Case
A pet owner rushes in with an emergency. Staff needs to quickly access the pet's history and create an urgent appointment.

### Implementation

```bash
#!/bin/bash
# emergency-visit.sh - Handle emergency visit workflow

BASE_URL="http://localhost:5000/api"
TOKEN="$1"  # Passed as argument

# Function to search and display owner/pet info
find_owner_pets() {
  local owner_id=$1
  
  # Get owner details
  echo "=== OWNER DETAILS ==="
  curl -s -X GET "$BASE_URL/owners/$owner_id" \
    -H "Authorization: Bearer $TOKEN" | jq '.data'
  
  # Get all pets for owner
  echo -e "\n=== PETS FOR THIS OWNER ==="
  curl -s -X GET "$BASE_URL/pets" \
    -H "Authorization: Bearer $TOKEN" | \
    jq ".data[] | select(.owner_id == $owner_id)"
  
  # Get recent appointments
  echo -e "\n=== RECENT APPOINTMENTS ==="
  curl -s -X GET "$BASE_URL/appointments" \
    -H "Authorization: Bearer $TOKEN" | \
    jq ".data[] | select(.owner_id == $owner_id) | 
           {id, pet_name, date, reason, status}" | \
    head -20
}

# Function to create emergency appointment
create_emergency_appointment() {
  local pet_id=$1
  local owner_id=$2
  
  echo "Creating emergency appointment..."
  curl -s -X POST "$BASE_URL/appointments" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"pet_id\": $pet_id,
      \"owner_id\": $owner_id,
      \"date\": \"$(date +%Y-%m-%d)\",
      \"time\": \"$(date +%H:%M)\",
      \"reason\": \"EMERGENCY - Acute condition\",
      \"status\": \"scheduled\",
      \"notes\": \"Owner reported emergency condition\"
    }" | jq '.data'
}

# Usage
echo "Enter owner ID:"
read OWNER_ID
find_owner_pets $OWNER_ID

echo -e "\nEnter pet ID for emergency visit:"
read PET_ID
create_emergency_appointment $PET_ID $OWNER_ID
```

### API Response Example
```json
{
  "success": true,
  "data": {
    "id": 42,
    "pet_id": 1,
    "owner_id": 1,
    "pet_name": "Max",
    "owner_name": "John Smith",
    "owner_phone": "555-0101",
    "date": "2024-12-19",
    "time": "16:45",
    "reason": "EMERGENCY - Acute condition",
    "status": "scheduled",
    "notes": "Owner reported emergency condition"
  }
}
```

---

## 📋 Scenario 2: Daily Clinic Report Generation

### Use Case
Clinic manager wants to generate a report of all appointments for the day with pet and owner information.

### Implementation

```bash
#!/bin/bash
# daily-report.sh - Generate daily clinic report

BASE_URL="http://localhost:5000/api"
TOKEN="$1"

generate_daily_report() {
  local report_date=$1
  
  echo "=========================================="
  echo "PawClinic Daily Report - $report_date"
  echo "=========================================="
  echo ""
  
  # Fetch all appointments
  local appointments=$(curl -s -X GET "$BASE_URL/appointments" \
    -H "Authorization: Bearer $TOKEN" | jq -c '.data[]')
  
  # Filter by date and format
  local count=0
  echo "TIME    | PET NAME         | SPECIES | OWNER NAME       | REASON"
  echo "--------|------------------|---------|------------------|--------------------"
  
  echo "$appointments" | while read appt; do
    local date=$(echo $appt | jq -r '.date')
    local time=$(echo $appt | jq -r '.time')
    local pet=$(echo $appt | jq -r '.pet_name')
    local species=$(echo $appt | jq -r '.species // "N/A"')
    local owner=$(echo $appt | jq -r '.owner_name')
    local reason=$(echo $appt | jq -r '.reason')
    
    if [ "$date" = "$report_date" ]; then
      printf "%s | %-16s | %-7s | %-16s | %s\n" \
        "$time" "$pet" "$species" "$owner" "$reason"
      count=$((count + 1))
    fi
  done
  
  echo ""
  echo "Total appointments: $count"
}

# Usage
TODAY=$(date +%Y-%m-%d)
generate_daily_report "$TODAY"
```

### Sample Output
```
==========================================
PawClinic Daily Report - 2024-12-19
==========================================

TIME    | PET NAME         | SPECIES | OWNER NAME       | REASON
--------|------------------|---------|------------------|--------------------
09:00   | Max              | Dog     | John Smith       | Annual checkup
10:30   | Luna             | Cat     | John Smith       | Vaccination
14:00   | Charlie          | Dog     | Sarah Johnson    | Follow-up examination
15:30   | Bella            | Cat     | Michael Brown    | Dental cleaning

Total appointments: 4
```

---

## 🐶 Scenario 3: Pet Medical History Export

### Use Case
Veterinarian needs complete medical history for a specific pet including owner contact and appointment history.

### Implementation

```javascript
// petMedicalHistory.js - Export pet medical history

const axios = require('axios');

async function getPetMedicalHistory(petId, token) {
  const baseURL = 'http://localhost:5000/api';

  try {
    // 1. Get pet details
    const petResponse = await axios.get(
      `${baseURL}/pets/${petId}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    const pet = petResponse.data.data;

    // 2. Get owner details
    const ownerResponse = await axios.get(
      `${baseURL}/owners/${pet.owner_id}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    const owner = ownerResponse.data.data;

    // 3. Get all appointments for this pet
    const appointmentsResponse = await axios.get(
      `${baseURL}/appointments`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    const petAppointments = appointmentsResponse.data.data.filter(
      a => a.pet_id === petId
    );

    // 4. Compile medical history
    const medicalHistory = {
      generatedAt: new Date().toISOString(),
      pet: {
        id: pet.id,
        name: pet.name,
        species: pet.species,
        breed: pet.breed,
        age: pet.age,
        weight: pet.weight
      },
      owner: {
        name: owner.name,
        phone: owner.phone,
        email: owner.email,
        address: owner.address
      },
      medicalHistory: {
        totalVisits: petAppointments.length,
        appointments: petAppointments.map(appt => ({
          date: appt.date,
          time: appt.time,
          reason: appt.reason,
          status: appt.status,
          notes: appt.notes
        }))
      }
    };

    return medicalHistory;

  } catch (error) {
    console.error('Error fetching medical history:', error.message);
    throw error;
  }
}

// Usage
const token = 'YOUR_JWT_TOKEN';
getPetMedicalHistory(1, token)
  .then(history => {
    console.log(JSON.stringify(history, null, 2));
  })
  .catch(err => console.error(err));
```

### Output Example
```json
{
  "generatedAt": "2024-12-19T10:30:00.000Z",
  "pet": {
    "id": 1,
    "name": "Max",
    "species": "Dog",
    "breed": "Golden Retriever",
    "age": 5,
    "weight": 32.5
  },
  "owner": {
    "name": "John Smith",
    "phone": "555-0101",
    "email": "john.smith@email.com",
    "address": "123 Main St, Anytown, ST 12345"
  },
  "medicalHistory": {
    "totalVisits": 3,
    "appointments": [
      {
        "date": "2024-12-20",
        "time": "09:00",
        "reason": "Annual checkup",
        "status": "scheduled",
        "notes": null
      },
      {
        "date": "2024-11-15",
        "time": "14:00",
        "reason": "Vaccination",
        "status": "completed",
        "notes": "Updated vaccines"
      }
    ]
  }
}
```

---

## 👥 Scenario 4: Owner Communication System

### Use Case
Send appointment reminders and updates to pet owners.

### Implementation

```javascript
// appointmentReminder.js - Send reminders to owners

const axios = require('axios');
const nodemailer = require('nodemailer');

// Configure email service
const emailService = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

async function sendAppointmentReminders(token) {
  const baseURL = 'http://localhost:5000/api';
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDate = tomorrow.toISOString().split('T')[0];

  try {
    // Get all appointments
    const appointmentsResponse = await axios.get(
      `${baseURL}/appointments`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );

    // Filter appointments for tomorrow
    const tomorrowAppointments = appointmentsResponse.data.data.filter(appt => {
      return appt.date === tomorrowDate && appt.status === 'scheduled';
    });

    // Send reminders
    for (const appt of tomorrowAppointments) {
      await sendReminderEmail(appt);
    }

    console.log(`Sent ${tomorrowAppointments.length} reminders`);

  } catch (error) {
    console.error('Error sending reminders:', error.message);
  }
}

async function sendReminderEmail(appointment) {
  const emailContent = `
    Dear ${appointment.owner_name},

    This is a friendly reminder that ${appointment.pet_name} has an appointment
    scheduled at PawClinic tomorrow:

    Date: ${appointment.date}
    Time: ${appointment.time}
    Reason: ${appointment.reason}

    Please arrive 10 minutes early and bring any relevant medical records.

    If you need to reschedule, please call us at (555) 123-4567.

    Best regards,
    PawClinic Team
  `;

  try {
    await emailService.sendMail({
      from: process.env.EMAIL_USER,
      to: appointment.owner_email,
      subject: `Appointment Reminder - ${appointment.pet_name}`,
      text: emailContent
    });
    console.log(`Reminder sent to ${appointment.owner_name}`);
  } catch (error) {
    console.error(`Failed to send email to ${appointment.owner_name}:`, error);
  }
}

// Usage: Run as cron job daily at 10 AM
module.exports = { sendAppointmentReminders };
```

### Cron Configuration
```bash
# In crontab: Run daily at 10 AM
0 10 * * * cd /var/www/pawclinic && node -e "const app = require('./appointmentReminder'); app.sendAppointmentReminders('YOUR_TOKEN')"
```

---

## 📊 Scenario 5: Pet Statistics Dashboard

### Use Case
Admin wants to see statistics about pets, appointments, and clinic operations.

### Implementation

```javascript
// clinicStats.js - Generate clinic statistics

const axios = require('axios');

async function getClinicStatistics(token) {
  const baseURL = 'http://localhost:5000/api';

  try {
    // Fetch data in parallel
    const [owners, pets, appointments] = await Promise.all([
      axios.get(`${baseURL}/owners`, 
        { headers: { 'Authorization': `Bearer ${token}` } }),
      axios.get(`${baseURL}/pets`, 
        { headers: { 'Authorization': `Bearer ${token}` } }),
      axios.get(`${baseURL}/appointments`, 
        { headers: { 'Authorization': `Bearer ${token}` } })
    ]);

    const ownerData = owners.data.data;
    const petData = pets.data.data;
    const appointmentData = appointments.data.data;

    // Calculate statistics
    const stats = {
      owners: {
        total: ownerData.length,
        withEmail: ownerData.filter(o => o.email).length,
        withoutEmail: ownerData.filter(o => !o.email).length
      },
      pets: {
        total: petData.length,
        bySpecies: {},
        byBreed: {},
        averageAge: 0,
        averageWeight: 0
      },
      appointments: {
        total: appointmentData.length,
        byStatus: {},
        thisMonth: 0,
        thisWeek: 0,
        today: 0
      }
    };

    // Calculate pet species breakdown
    petData.forEach(pet => {
      stats.pets.bySpecies[pet.species] = (stats.pets.bySpecies[pet.species] || 0) + 1;
      if (pet.breed) {
        stats.pets.byBreed[pet.breed] = (stats.pets.byBreed[pet.breed] || 0) + 1;
      }
    });

    // Calculate averages
    const petAges = petData.filter(p => p.age).map(p => p.age);
    const petWeights = petData.filter(p => p.weight).map(p => p.weight);
    
    stats.pets.averageAge = petAges.length > 0 
      ? (petAges.reduce((a, b) => a + b, 0) / petAges.length).toFixed(1)
      : 0;
    
    stats.pets.averageWeight = petWeights.length > 0
      ? (petWeights.reduce((a, b) => a + b, 0) / petWeights.length).toFixed(2)
      : 0;

    // Appointment breakdown
    appointmentData.forEach(appt => {
      stats.appointments.byStatus[appt.status] = 
        (stats.appointments.byStatus[appt.status] || 0) + 1;

      const apptDate = new Date(appt.date);
      const today = new Date();
      const thisMonth = new Date();
      thisMonth.setMonth(thisMonth.getMonth() - 1);
      const thisWeek = new Date();
      thisWeek.setDate(thisWeek.getDate() - 7);

      if (apptDate.toDateString() === today.toDateString()) {
        stats.appointments.today++;
      }
      if (apptDate > thisWeek) {
        stats.appointments.thisWeek++;
      }
      if (apptDate > thisMonth) {
        stats.appointments.thisMonth++;
      }
    });

    return stats;

  } catch (error) {
    console.error('Error fetching statistics:', error.message);
    throw error;
  }
}

// Display statistics
async function displayStatistics(token) {
  const stats = await getClinicStatistics(token);

  console.log('\n===== PAWCLINIC STATISTICS =====\n');
  
  console.log('OWNERS:');
  console.log(`  Total: ${stats.owners.total}`);
  console.log(`  With Email: ${stats.owners.withEmail}`);
  console.log(`  Without Email: ${stats.owners.withoutEmail}`);
  
  console.log('\nPETS:');
  console.log(`  Total: ${stats.pets.total}`);
  console.log(`  Average Age: ${stats.pets.averageAge} years`);
  console.log(`  Average Weight: ${stats.pets.averageWeight} kg`);
  console.log('  By Species:');
  Object.entries(stats.pets.bySpecies).forEach(([species, count]) => {
    console.log(`    ${species}: ${count}`);
  });
  
  console.log('\nAPPOINTMENTS:');
  console.log(`  Total: ${stats.appointments.total}`);
  console.log(`  Today: ${stats.appointments.today}`);
  console.log(`  This Week: ${stats.appointments.thisWeek}`);
  console.log(`  This Month: ${stats.appointments.thisMonth}`);
  console.log('  By Status:');
  Object.entries(stats.appointments.byStatus).forEach(([status, count]) => {
    console.log(`    ${status}: ${count}`);
  });

  console.log('\n================================\n');
}

module.exports = { getClinicStatistics, displayStatistics };
```

### Output Example
```
===== PAWCLINIC STATISTICS =====

OWNERS:
  Total: 3
  With Email: 2
  Without Email: 1

PETS:
  Total: 5
  Average Age: 4.0 years
  Average Weight: 18.50 kg
  By Species:
    Dog: 3
    Cat: 2

APPOINTMENTS:
  Total: 5
  Today: 1
  This Week: 2
  This Month: 5
  By Status:
    scheduled: 3
    completed: 2

================================
```

---

## 🔄 Scenario 6: Data Migration/Import

### Use Case
Import pet owners and pets from a CSV file.

### Implementation

```javascript
// importData.js - Import owners and pets from CSV

const axios = require('axios');
const fs = require('fs');
const csv = require('csv-parser');

async function importOwnersFromCSV(filePath, token) {
  const baseURL = 'http://localhost:5000/api';
  const owners = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        owners.push({
          name: row.owner_name,
          email: row.email,
          phone: row.phone,
          address: row.address
        });
      })
      .on('end', async () => {
        try {
          const results = [];
          for (const owner of owners) {
            const response = await axios.post(
              `${baseURL}/owners`,
              owner,
              { headers: { 'Authorization': `Bearer ${token}` } }
            );
            results.push(response.data.data);
            console.log(`Imported owner: ${owner.name}`);
          }
          resolve(results);
        } catch (error) {
          reject(error);
        }
      });
  });
}

async function importPetsFromCSV(filePath, token, ownerMap) {
  const baseURL = 'http://localhost:5000/api';
  const pets = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        const ownerEmail = row.owner_email;
        const owner = ownerMap[ownerEmail];

        if (owner) {
          pets.push({
            owner_id: owner.id,
            name: row.pet_name,
            species: row.species,
            breed: row.breed,
            age: parseInt(row.age) || null,
            weight: parseFloat(row.weight) || null
          });
        }
      })
      .on('end', async () => {
        try {
          const results = [];
          for (const pet of pets) {
            const response = await axios.post(
              `${baseURL}/pets`,
              pet,
              { headers: { 'Authorization': `Bearer ${token}` } }
            );
            results.push(response.data.data);
            console.log(`Imported pet: ${pet.name}`);
          }
          resolve(results);
        } catch (error) {
          reject(error);
        }
      });
  });
}

// Usage
async function performImport(token) {
  try {
    console.log('Importing owners...');
    const owners = await importOwnersFromCSV('./owners.csv', token);

    // Create map for owner lookup
    const ownerMap = {};
    owners.forEach(owner => {
      ownerMap[owner.email] = owner;
    });

    console.log(`Imported ${owners.length} owners\n`);

    console.log('Importing pets...');
    const pets = await importPetsFromCSV('./pets.csv', token, ownerMap);
    console.log(`Imported ${pets.length} pets`);

  } catch (error) {
    console.error('Import failed:', error.message);
  }
}

module.exports = { importOwnersFromCSV, importPetsFromCSV, performImport };
```

### CSV Format

**owners.csv:**
```
owner_name,email,phone,address
John Smith,john@example.com,555-0101,123 Main St
Sarah Johnson,sarah@example.com,555-0102,456 Oak Ave
Michael Brown,,555-0103,789 Pine Rd
```

**pets.csv:**
```
owner_email,pet_name,species,breed,age,weight
john@example.com,Max,Dog,Golden Retriever,5,32.5
john@example.com,Luna,Cat,Siamese,3,4.2
sarah@example.com,Charlie,Dog,Beagle,2,12.8
```

---

## 🛡️ Scenario 7: Error Handling & Validation

### Use Case
Handle various error scenarios gracefully.

### Implementation

```javascript
// errorHandling.js - Comprehensive error handling

const axios = require('axios');

async function createPetWithErrorHandling(petData, token) {
  const baseURL = 'http://localhost:5000/api';

  try {
    const response = await axios.post(
      `${baseURL}/pets`,
      petData,
      { 
        headers: { 'Authorization': `Bearer ${token}` },
        validateStatus: () => true // Don't throw on any status
      }
    );

    // Handle different response statuses
    if (response.status === 201) {
      return {
        success: true,
        data: response.data.data,
        message: 'Pet created successfully'
      };
    }

    // Validation error (400)
    if (response.status === 400) {
      return {
        success: false,
        error: 'VALIDATION_ERROR',
        message: response.data.message,
        details: 'Please check the following fields: ' + response.data.message
      };
    }

    // Owner not found (404)
    if (response.status === 404) {
      return {
        success: false,
        error: 'OWNER_NOT_FOUND',
        message: 'The specified owner does not exist',
        ownerId: petData.owner_id
      };
    }

    // Unauthorized (401)
    if (response.status === 401) {
      return {
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Invalid or expired authentication token'
      };
    }

    // Server error (5xx)
    if (response.status >= 500) {
      return {
        success: false,
        error: 'SERVER_ERROR',
        message: 'Server encountered an error. Please try again later.'
      };
    }

  } catch (error) {
    // Network error
    return {
      success: false,
      error: 'NETWORK_ERROR',
      message: error.message || 'Failed to connect to API'
    };
  }
}

// Usage examples
async function demonstrateErrorHandling(token) {
  console.log('=== Testing Error Scenarios ===\n');

  // Test 1: Missing required field
  console.log('Test 1: Missing required field');
  let result = await createPetWithErrorHandling(
    { owner_id: 1, name: 'Test' }, // Missing species
    token
  );
  console.log(JSON.stringify(result, null, 2));
  console.log('\n---\n');

  // Test 2: Invalid owner
  console.log('Test 2: Invalid owner ID');
  result = await createPetWithErrorHandling(
    {
      owner_id: 99999,
      name: 'Test Pet',
      species: 'Dog'
    },
    token
  );
  console.log(JSON.stringify(result, null, 2));
  console.log('\n---\n');

  // Test 3: Valid creation
  console.log('Test 3: Valid pet creation');
  result = await createPetWithErrorHandling(
    {
      owner_id: 1,
      name: 'Happy',
      species: 'Dog',
      breed: 'Labrador',
      age: 3,
      weight: 28.5
    },
    token
  );
  console.log(JSON.stringify(result, null, 2));
}

module.exports = { createPetWithErrorHandling, demonstrateErrorHandling };
```

---

## 📚 Additional Resources

### Tools for Testing
- **Postman**: Import the collection from `postman/PawClinic_API_Collection.json`
- **cURL**: Use command-line examples
- **Insomnia**: Alternative to Postman
- **Thunder Client**: VS Code extension

### Monitoring & Analytics
- Set up logging with Winston
- Use Sentry for error tracking
- Monitor with PM2 Plus
- Use New Relic for APM

### Integration Ideas
- Connect to SMS service (Twilio) for appointment reminders
- Integrate with payment gateway (Stripe)
- Connect to calendar (Google Calendar)
- Sync with email service (SendGrid)

---

All examples above can be run immediately with a valid JWT token from the `/api/auth/login` endpoint. Happy coding! 🐾
