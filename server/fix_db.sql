-- Kullanıcı rollerini düzenle
UPDATE users SET role = 'doctor' WHERE email = 'sopramacg@hotmail.com';
UPDATE users SET role = 'receptionist' WHERE email = 'mucahit._.yildiz@hotmail.com';
UPDATE users SET role = 'patient' WHERE email = 'mucahityildiz1234@gmail.com';

-- Patient tablosundaki hatalı kayıtları düzelt
DELETE FROM patients WHERE user_id IN (
  SELECT id FROM users WHERE role != 'patient'
);

-- Doctors tablosundaki hatalı kayıtları düzelt
DELETE FROM doctors WHERE user_id IN (
  SELECT id FROM users WHERE role != 'doctor'
);

-- Appointments tablosundaki durumları listele
SELECT a.id, a.patient_id, a.doctor_id, a.status, 
       p.first_name AS patient_first_name, p.last_name AS patient_last_name,
       d.first_name AS doctor_first_name, d.last_name AS doctor_last_name
FROM appointments a
LEFT JOIN patients p ON a.patient_id = p.id
LEFT JOIN doctors d ON a.doctor_id = d.id
ORDER BY a.id DESC; 