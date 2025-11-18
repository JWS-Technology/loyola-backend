import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/loyola_erp";
const { ObjectId } = mongoose.Types;

// Define the Student Schema locally to use it for insertion
const studentSchema = new mongoose.Schema({
    roll_no: { type: String, unique: true, required: true },
    name: { type: String, required: true },
    gender: String,
    dob: Date,
    parentName: String,
    contact: String,
    email: String,
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
    batch: { type: Number, required: true },
    subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subject" }],
});

const Student = mongoose.model("Student", studentSchema);

async function seedStudents() {
    try {
        console.log("🔵 Connecting to MongoDB...");
        await mongoose.connect(MONGO_URI);
        console.log("✅ Connected.");

        // 1. Reference the BCA Course ID (Must match the one from seed-timetable.js)
        const courseBCAId = new ObjectId("690a30000000000000000001");

        // 2. Student Data from Image
        // Batch 2023 implies they are currently in 3rd Year (Sem 5/6)
        const studentsData = [
            { name: "AMBUROSE G", gender: "Male", dob: "2004-06-25", parent: "GURUSAMY", phone: "7639000001", email: "aamburos@gmail.com" },
            { name: "ANTO L", gender: "Male", dob: "2004-02-10", parent: "LOURDU", phone: "6400000002", email: "antoviriyi@gmail.com" },
            { name: "DEVANANDH M", gender: "Male", dob: "2004-08-13", parent: "MURUGAN", phone: "7400000003", email: "kinganand@gmail.com" },
            { name: "DHARANI T", gender: "Male", dob: "2004-07-17", parent: "THANGARASU", phone: "9700000004", email: "dharani16@gmail.com" },
            { name: "DIVYESH PAUL T", gender: "Male", dob: "2004-06-04", parent: "THOMAS", phone: "9400000005", email: "tdivyeshp@gmail.com" },
            { name: "GAGAN C", gender: "Male", dob: "2004-03-26", parent: "CHINNA", phone: "9900000006", email: "ggagan92@gmail.com" },
            { name: "GOGULAN K", gender: "Male", dob: "2004-01-04", parent: "KUMAR", phone: "9200000007", email: "ggokulan7@gmail.com" },
            { name: "GOPINATH M", gender: "Male", dob: "2003-12-17", parent: "MANIVEL", phone: "6400000008", email: "gopims18@gmail.com" },
            { name: "INBARASAN M", gender: "Male", dob: "2004-03-04", parent: "MURUGAN", phone: "8600000009", email: "inbamuru@gmail.com" },
            { name: "ISAAC SAM PRAKASH", gender: "Male", dob: "2003-07-24", parent: "SUBRAMANI", phone: "7600000010", email: "issacsam@gmail.com" },
            { name: "JASTON A", gender: "Male", dob: "2004-05-19", parent: "ARUL RAJ", phone: "9100000011", email: "jaston200@gmail.com" },
            { name: "JEEVANKUMAR S", gender: "Male", dob: "2004-12-05", parent: "SIVA", phone: "9400000012", email: "sivajeeva@gmail.com" },
            { name: "JOE PRASANNA C", gender: "Male", dob: "2004-09-27", parent: "CHINNA", phone: "9900000013", email: "joeprasan@gmail.com" },
            { name: "JOHN BRITTO A", gender: "Male", dob: "2004-01-30", parent: "AROCKIASAMY", phone: "6400000014", email: "johnbritto@gmail.com" },
            { name: "JOSEPH VIJAY J", gender: "Male", dob: "2004-07-03", parent: "JOHN V", phone: "9600000015", email: "vijayalon@gmail.com" },
            { name: "MARIYA NICHOLAS", gender: "Male", dob: "2004-06-14", parent: "JOHN CF", phone: "7700000016", email: "mariyanic@gmail.com" },
            { name: "NAVEEN ANTONY", gender: "Male", dob: "2004-06-10", parent: "SEM ANTONY", phone: "7800000017", email: "naveenant@gmail.com" },
            { name: "NITHISH M", gender: "Male", dob: "2004-09-30", parent: "MATHAI", phone: "9300000018", email: "nithish731@gmail.com" },
            { name: "PARTHA SARATHY", gender: "Male", dob: "2004-08-26", parent: "LAKSHMANAN", phone: "8100000019", email: "1.parthasa@gmail.com" },
            { name: "RAKESH V", gender: "Male", dob: "2004-08-26", parent: "VENKAT", phone: "9000000020", email: "rakeshsub@gmail.com" },
            { name: "RENISTON J", gender: "Male", dob: "2004-07-31", parent: "JESURAJ", phone: "9400000021", email: "renistonje@gmail.com" },
            { name: "ROHITH P", gender: "Male", dob: "2004-04-15", parent: "PRAKASH", phone: "7800000022", email: "rohithpral@gmail.com" },
            { name: "SALETE KEJISTUS", gender: "Male", dob: "2004-10-14", parent: "VINCENT", phone: "8300000023", email: "saletekej@gmail.com" },
            { name: "SANTHURU D", gender: "Male", dob: "2004-04-05", parent: "DHANAPAL", phone: "6400000024", email: "santhuruc@gmail.com" },
            { name: "SARAVANA V", gender: "Male", dob: "2004-07-05", parent: "VIJAYAKUMAR", phone: "6400000025", email: "saravanac@gmail.com" },
            { name: "SRIDHAR A", gender: "Male", dob: "2004-03-11", parent: "ANANDHAN", phone: "9800000026", email: "anandhans@gmail.com" },
            { name: "SUBASH S L", gender: "Male", dob: "2004-01-07", parent: "SANKAR", phone: "8900000027", email: "subashsan@gmail.com" },
            { name: "SUVIN M", gender: "Male", dob: "2004-12-11", parent: "MURUGESAN", phone: "9100000028", email: "suvinsaba@gmail.com" },
            { name: "VIJAY C K", gender: "Male", dob: "2004-11-14", parent: "CHELLAM", phone: "8400000029", email: "vijayvj44@gmail.com" },
            { name: "YAZHENIYAN R", gender: "Male", dob: "2004-03-21", parent: "RAJAM", phone: "6400000030", email: "leevincen@gmail.com" },
            { name: "KALAIVANI P", gender: "Female", dob: "2004-12-15", parent: "PERUMAL", phone: "8500000031", email: "kalaikalai@gmail.com" },
            { name: "MAHESHWARI S", gender: "Female", dob: "2004-05-17", parent: "SAKTHIVEL", phone: "9600000032", email: "suregakut@gmail.com" },
            { name: "MONISA S", gender: "Female", dob: "2004-05-06", parent: "SARAVANAN", phone: "9800000033", email: "monisabc@gmail.com" },
            { name: "NANCIYA MARY", gender: "Female", dob: "2004-10-09", parent: "SAVARIMUTHU", phone: "8500000034", email: "thomasnan@gmail.com" },
            { name: "NAVIYA EVANJA", gender: "Female", dob: "2004-10-30", parent: "JOSEPH", phone: "8800000035", email: "navi8629@gmail.com" },
            { name: "PHOEBE GRACE J", gender: "Female", dob: "2004-03-01", parent: "PRABAKARAN", phone: "8100000036", email: "phoebegra@gmail.com" },
            { name: "RANJANINADIYA", gender: "Female", dob: "2004-06-06", parent: "GOPALSAMY", phone: "9300000037", email: "nadiyaran@gmail.com" },
            { name: "RENUGA M", gender: "Female", dob: "2004-01-23", parent: "MATHESWARAN", phone: "9400000038", email: "renuga23@gmail.com" },
            { name: "SARANYA T", gender: "Female", dob: "2004-12-08", parent: "THIYAGARAJAN", phone: "6400000039", email: "saranyath@gmail.com" },
            { name: "SINDHU M", gender: "Female", dob: "2004-03-12", parent: "MURUGAN", phone: "8700000040", email: "murugan2@gmail.com" },
            { name: "VENMANI JOTHI", gender: "Female", dob: "2004-09-10", parent: "SETHURAMAN", phone: "9300000041", email: "venjo100@gmail.com" },
        ];

        console.log(`🚀 Preparing to insert ${studentsData.length} students...`);

        // 3. Transform data to match Schema
        const formattedStudents = studentsData.map((s, index) => {
            const rollNo = `23BCA${String(index + 1).padStart(3, '0')}`; // Generates 23BCA001, 23BCA002...

            return {
                roll_no: rollNo,
                name: s.name,
                gender: s.gender,
                dob: new Date(s.dob),
                parentName: s.parent,
                contact: s.phone,
                email: s.email,
                courseId: courseBCAId,
                batch: 2023, // 2023 + 2 years = 2025 (Sem 5/6)
                subjects: [] // Empty for now, can be populated later
            };
        });

        // 4. Cleanup old student data for this batch to avoid duplicates
        console.log("🧹 Cleaning up old student records for 2023 Batch...");
        await Student.deleteMany({ batch: 2023, courseId: courseBCAId });

        // 5. Insert
        await Student.insertMany(formattedStudents);
        console.log("🎉 SUCCESS: Students inserted successfully!");

    } catch (error) {
        console.error("❌ ERROR:", error);
    } finally {
        await mongoose.disconnect();
        console.log("👋 Disconnected.");
    }
}

seedStudents();
