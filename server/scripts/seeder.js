const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: __dirname + '/.env' });

const seedDB = async () => {
    console.log("Starting DB Seeder...");
    
    // Connect explicitly so we don't rely on existing project db.js which has pools
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: process.env.DB_HOST !== 'localhost' ? { rejectUnauthorized: false } : false
    });

    const clinics = [
        { name: "Cardiology", desc: "Heart and cardiovascular system care." },
        { name: "Neurology", desc: "Disorders of the nervous system." },
        { name: "Pediatrics", desc: "Medical care of infants, children, and adolescents." },
        { name: "Orthopedics", desc: "Skeletal system and associated muscles, joints, and ligaments." },
        { name: "General Surgery", desc: "Routine surgical procedures." },
        { name: "Dermatology", desc: "Skin, hair, and nail health." },
        { name: "Ophthalmology", desc: "Eye health and visual disorders." },
        { name: "Psychiatry", desc: "Mental health and behavioral disorders." },
        { name: "Oncology", desc: "Cancer treatment and prevention." },
        { name: "Gynecology", desc: "Women's reproductive health." },
    ];

    const firstNames = ["James", "Emma", "Liam", "Olivia", "Noah", "Ava", "William", "Sophia", "Lucas", "Isabella", "Benjamin", "Mia", "Jacob", "Charlotte", "Michael", "Amelia", "Elijah", "Harper", "Ethan", "Evelyn"];
    const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzales", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin"];

    try {
        await connection.beginTransaction();

        // 1. Insert 10 Clinics
        console.log("Seeding 10 Clinics...");
        for (const c of clinics) {
            // Only insert if doesn't exist
            const [exist] = await connection.query('SELECT id FROM clinics WHERE name = ?', [c.name]);
            if (exist.length === 0) {
                await connection.query('INSERT INTO clinics (name, description, status) VALUES (?, ?, ?)', [c.name, c.desc, 'active']);
            }
        }

        // Fetch clinic IDs
        const [dbClinics] = await connection.query('SELECT id, name FROM clinics LIMIT 15');
        
        let doctorsAdded = 0;
        const passwordHash = await bcrypt.hash('doctor123', 10);

        console.log("Seeding 30 Doctors...");
        for (const clinic of dbClinics) {
            // Count current doctors in clinic
            const [docs] = await connection.query('SELECT id FROM doctors WHERE clinic_id = ?', [clinic.id]);
            let toAdd = 3 - docs.length;

            for (let i = 0; i < toAdd; i++) {
                const fname = firstNames[Math.floor(Math.random() * firstNames.length)];
                const lname = lastNames[Math.floor(Math.random() * lastNames.length)];
                const email = `${fname.toLowerCase()}.${lname.toLowerCase()}${Math.floor(Math.random() * 1000)}@careplus.com`;
                const phone = `555-${Math.floor(100+Math.random()*900)}-${Math.floor(1000+Math.random()*9000)}`;
                
                // Construct user record
                const uniqueId = Date.now().toString().slice(-6) + i + Math.floor(Math.random()*1000);
                const [uRes] = await connection.query(
                    'INSERT INTO users (username, email, password, role, status) VALUES (?, ?, ?, ?, ?)',
                    [`dr_${fname.toLowerCase()}_${uniqueId}`, email, passwordHash, 'doctor', 'active']
                );
                
                // Construct doctor record
                await connection.query(
                    'INSERT INTO doctors (user_id, first_name, last_name, specialization, qualification, phone, clinic_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [uRes.insertId, fname, lname, clinic.name, 'MD, Board Certified', phone, clinic.id]
                );
                doctorsAdded++;
            }
        }

        await connection.commit();
        console.log(`✅ Seeding Complete. Added ${doctorsAdded} new doctors.`);

    } catch (e) {
        await connection.rollback();
        console.error("❌ Database Seed Failed:", e);
    } finally {
        await connection.end();
    }
};

seedDB();
