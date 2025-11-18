import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/loyola_erp";
const { ObjectId } = mongoose.Types;

async function seedTimetable() {
    try {
        console.log("🔵 Connecting to MongoDB...");
        await mongoose.connect(MONGO_URI);
        console.log("✅ Connected.");

        const db = mongoose.connection.db;

        // 2. DEFINE IDs FIRST (Needed for cleanup logic)
        const courseBCAId = new ObjectId("690a30000000000000000001");

        const staffKavitha = new ObjectId("690b00000000000000000001");
        const staffEdward = new ObjectId("690b00000000000000000002");
        const staffGomathi = new ObjectId("690b00000000000000000003");
        const staffKarthik = new ObjectId("690b00000000000000000004");
        const staffLakshmi = new ObjectId("690b00000000000000000005");
        const staffXavier = new ObjectId("690b00000000000000000006");
        const staffJaya = new ObjectId("690b00000000000000000007");
        const staffAmuthan = new ObjectId("690b00000000000000000008");
        const staffMurugesan = new ObjectId("690b00000000000000000009");
        const staffLatha = new ObjectId("690b00000000000000000010");

        const subTamil2 = new ObjectId("690c00000000000000000001");
        const subEng2 = new ObjectId("690c00000000000000000002");
        const subCPlus = new ObjectId("690c00000000000000000003");
        const subCPlusLab = new ObjectId("690c00000000000000000004");
        const subAllied2 = new ObjectId("690c00000000000000000005");
        const subNMEC2 = new ObjectId("690c00000000000000000006");
        const subFIT = new ObjectId("690c00000000000000000007");

        const subTamil4 = new ObjectId("690c00000000000000000008");
        const subEng4 = new ObjectId("690c00000000000000000009");
        const subJava = new ObjectId("690c00000000000000000010");
        const subJavaLab = new ObjectId("690c00000000000000000011");
        const subAllied4 = new ObjectId("690c00000000000000000012");
        const subSoftTest = new ObjectId("690c00000000000000000013");
        const subNM = new ObjectId("690c00000000000000000014");
        const subEVS = new ObjectId("690c00000000000000000015");

        const subCN = new ObjectId("690c00000000000000000016");
        const subRProg = new ObjectId("690c00000000000000000017");
        const subRProgLab = new ObjectId("690c00000000000000000018");
        const subDBMS = new ObjectId("690c00000000000000000019");
        const subIOT = new ObjectId("690c00000000000000000020");
        const subAdvExcel = new ObjectId("690c00000000000000000021");
        const subLibrary = new ObjectId("690c00000000000000000099");

        // 1. CLEANUP: Delete existing data to prevent Duplicate Key Errors
        console.log("🧹 Clearing old data...");

        // Delete the specific course
        await db.collection("courses").deleteMany({ code: "BCA" });

        // Delete ALL the staff members we are about to add (by ID) to avoid conflicts
        const staffIds = [staffKavitha, staffEdward, staffGomathi, staffKarthik, staffLakshmi, staffXavier, staffJaya, staffAmuthan, staffMurugesan, staffLatha];
        await db.collection("staffs").deleteMany({ _id: { $in: staffIds } });

        // Reset subjects and timetables for this course
        await db.collection("subjects").deleteMany({ courseId: courseBCAId });
        await db.collection("timetables").deleteMany({ courseId: courseBCAId });

        console.log("✅ Data cleared.");

        // 3. INSERT DATA
        console.log("🚀 Inserting data...");

        // --- Insert Course ---
        await db.collection("courses").insertOne({
            _id: courseBCAId,
            name: "Bachelor of Computer Applications",
            code: "BCA",
            department: "Computer Applications",
            duration: 3,
            __v: 0
        });

        // --- Insert Staff (NOW WITH EMAILS) ---
        await db.collection("staffs").insertMany([
            { _id: staffKavitha, staffId: "BCA001", email: "kavitha@loyola.edu", name: "Dr. S. Kavitha", department: "BCA", designation: "Asst. Professor" },
            { _id: staffEdward, staffId: "BCA002", email: "edward@loyola.edu", name: "Mr. T. Edward Francis", department: "BCA", designation: "Asst. Professor" },
            { _id: staffGomathi, staffId: "BCA003", email: "gomathi@loyola.edu", name: "Mrs. S. Gomathi", department: "BCA", designation: "Asst. Professor" },
            { _id: staffKarthik, staffId: "BCA004", email: "karthik@loyola.edu", name: "Mr. R. Karthik", department: "BCA", designation: "Asst. Professor" },
            { _id: staffLakshmi, staffId: "ENG001", email: "lakshmikandan@loyola.edu", name: "Mr. R. Lakshmikandan", department: "English", designation: "Asst. Professor" },
            { _id: staffXavier, staffId: "TAM001", email: "xavier@loyola.edu", name: "Dr. Xavier", department: "Tamil", designation: "Asst. Professor" },
            { _id: staffJaya, staffId: "MAT001", email: "jaya@loyola.edu", name: "Mrs. A. Jaya", department: "Maths", designation: "Asst. Professor" },
            { _id: staffAmuthan, staffId: "ENG002", email: "amuthan@loyola.edu", name: "Mr. J. Amuthan", department: "English", designation: "Asst. Professor" },
            { _id: staffMurugesan, staffId: "COM001", email: "murugesan@loyola.edu", name: "Mr. P. Murugesan", department: "Commerce", designation: "Asst. Professor" },
            { _id: staffLatha, staffId: "TAM002", email: "latha@loyola.edu", name: "Dr. Latha", department: "Tamil", designation: "Asst. Professor" }
        ]);

        // --- Insert Subjects ---
        await db.collection("subjects").insertMany([
            // I BCA
            { _id: subTamil2, name: "Tamil - II", code: "24UFTA02", semester: 2, courseId: courseBCAId },
            { _id: subEng2, name: "English - II", code: "24UFEN02", semester: 2, courseId: courseBCAId },
            { _id: subCPlus, name: "Object Oriented Programming using C++", code: "23UCACC02", semester: 2, courseId: courseBCAId },
            { _id: subCPlusLab, name: "Practical: C++ Lab", code: "23UCACCP02", semester: 2, courseId: courseBCAId },
            { _id: subAllied2, name: "Discrete Mathematics - II", code: "23UMAEGS02", semester: 2, courseId: courseBCAId },
            { _id: subNMEC2, name: "NMEC - II", code: "23UTAN02", semester: 2, courseId: courseBCAId },
            { _id: subFIT, name: "Fundamentals of IT", code: "23UCASE01", semester: 2, courseId: courseBCAId },

            // II BCA
            { _id: subTamil4, name: "Tamil - IV", code: "23UFTA04", semester: 4, courseId: courseBCAId },
            { _id: subEng4, name: "English - IV", code: "23UFEN04", semester: 4, courseId: courseBCAId },
            { _id: subJava, name: "Programming in Java", code: "23UCACC04", semester: 4, courseId: courseBCAId },
            { _id: subJavaLab, name: "Practical: Java Lab", code: "23UCACCP04", semester: 4, courseId: courseBCAId },
            { _id: subAllied4, name: "Cost and Management Accounting", code: "23UCMA02", semester: 4, courseId: courseBCAId },
            { _id: subSoftTest, name: "Software Testing", code: "23UCASE05", semester: 4, courseId: courseBCAId },
            { _id: subNM, name: "Naan Muthalvan", code: "NM-001", semester: 4, courseId: courseBCAId },
            { _id: subEVS, name: "Environmental Studies", code: "23UES01", semester: 4, courseId: courseBCAId },

            // III BCA
            { _id: subCN, name: "Computer Networks", code: "23UCACC07", semester: 6, courseId: courseBCAId },
            { _id: subRProg, name: "Data Analytics using R", code: "23UCACC08", semester: 6, courseId: courseBCAId },
            { _id: subRProgLab, name: "Practical: R Programming Lab", code: "23UCACCP06", semester: 6, courseId: courseBCAId },
            { _id: subDBMS, name: "Database Management System", code: "23UCADE05", semester: 6, courseId: courseBCAId },
            { _id: subIOT, name: "IOT and its Applications", code: "23UCADE07", semester: 6, courseId: courseBCAId },
            { _id: subAdvExcel, name: "Advanced Excel", code: "23UCASE11", semester: 6, courseId: courseBCAId },
            { _id: subLibrary, name: "Library / Seminar", code: "LIB", semester: 0, courseId: courseBCAId }
        ]);

        // --- Insert Timetables ---
        await db.collection("timetables").insertMany([
            // I BCA (Semester 2)
            { day: "Day 1", period: 1, semester: 2, courseId: courseBCAId, subjectId: subEng2, staffId: staffLakshmi },
            { day: "Day 1", period: 2, semester: 2, courseId: courseBCAId, subjectId: subTamil2, staffId: staffXavier },
            { day: "Day 1", period: 3, semester: 2, courseId: courseBCAId, subjectId: subAllied2, staffId: staffJaya },
            { day: "Day 1", period: 4, semester: 2, courseId: courseBCAId, subjectId: subAllied2, staffId: staffJaya },
            { day: "Day 1", period: 5, semester: 2, courseId: courseBCAId, subjectId: subEng2, staffId: staffLakshmi },

            { day: "Day 2", period: 1, semester: 2, courseId: courseBCAId, subjectId: subLibrary, staffId: staffKarthik },
            { day: "Day 2", period: 2, semester: 2, courseId: courseBCAId, subjectId: subAllied2, staffId: staffJaya },
            { day: "Day 2", period: 3, semester: 2, courseId: courseBCAId, subjectId: subFIT, staffId: staffKavitha },
            { day: "Day 2", period: 4, semester: 2, courseId: courseBCAId, subjectId: subCPlus, staffId: staffKarthik },
            { day: "Day 2", period: 5, semester: 2, courseId: courseBCAId, subjectId: subNMEC2, staffId: null },
            { day: "Day 2", period: 6, semester: 2, courseId: courseBCAId, subjectId: subTamil2, staffId: staffXavier },

            { day: "Day 3", period: 1, semester: 2, courseId: courseBCAId, subjectId: subCPlusLab, staffId: staffKarthik },
            { day: "Day 3", period: 2, semester: 2, courseId: courseBCAId, subjectId: subCPlusLab, staffId: staffKarthik },
            { day: "Day 3", period: 3, semester: 2, courseId: courseBCAId, subjectId: subTamil2, staffId: staffXavier },
            { day: "Day 3", period: 4, semester: 2, courseId: courseBCAId, subjectId: subAllied2, staffId: staffJaya },

            { day: "Day 4", period: 1, semester: 2, courseId: courseBCAId, subjectId: subCPlus, staffId: staffKarthik },
            { day: "Day 4", period: 2, semester: 2, courseId: courseBCAId, subjectId: subFIT, staffId: staffKavitha },
            { day: "Day 4", period: 3, semester: 2, courseId: courseBCAId, subjectId: subEng2, staffId: staffLakshmi },
            { day: "Day 4", period: 4, semester: 2, courseId: courseBCAId, subjectId: subCPlus, staffId: staffKarthik },
            { day: "Day 4", period: 5, semester: 2, courseId: courseBCAId, subjectId: subTamil2, staffId: staffXavier },

            { day: "Day 5", period: 1, semester: 2, courseId: courseBCAId, subjectId: subCPlus, staffId: staffKarthik },
            { day: "Day 5", period: 2, semester: 2, courseId: courseBCAId, subjectId: subEng2, staffId: staffLakshmi },
            { day: "Day 5", period: 3, semester: 2, courseId: courseBCAId, subjectId: subTamil2, staffId: staffXavier },
            { day: "Day 5", period: 4, semester: 2, courseId: courseBCAId, subjectId: subAllied2, staffId: staffJaya },
            { day: "Day 5", period: 5, semester: 2, courseId: courseBCAId, subjectId: subTamil2, staffId: staffXavier },

            { day: "Day 6", period: 1, semester: 2, courseId: courseBCAId, subjectId: subCPlus, staffId: staffKarthik },
            { day: "Day 6", period: 2, semester: 2, courseId: courseBCAId, subjectId: subEng2, staffId: staffLakshmi },
            { day: "Day 6", period: 3, semester: 2, courseId: courseBCAId, subjectId: subAllied2, staffId: staffJaya },
            { day: "Day 6", period: 4, semester: 2, courseId: courseBCAId, subjectId: subEng2, staffId: staffLakshmi },
            { day: "Day 6", period: 5, semester: 2, courseId: courseBCAId, subjectId: subNMEC2, staffId: null },

            // II BCA (Semester 4)
            { day: "Day 1", period: 1, semester: 4, courseId: courseBCAId, subjectId: subJava, staffId: staffGomathi },
            { day: "Day 1", period: 2, semester: 4, courseId: courseBCAId, subjectId: subAllied4, staffId: staffMurugesan },
            { day: "Day 1", period: 3, semester: 4, courseId: courseBCAId, subjectId: subTamil4, staffId: staffLatha },
            { day: "Day 1", period: 4, semester: 4, courseId: courseBCAId, subjectId: subNM, staffId: staffGomathi },
            { day: "Day 1", period: 5, semester: 4, courseId: courseBCAId, subjectId: subEng4, staffId: staffAmuthan },
            { day: "Day 1", period: 6, semester: 4, courseId: courseBCAId, subjectId: subLibrary, staffId: null },

            { day: "Day 2", period: 1, semester: 4, courseId: courseBCAId, subjectId: subJava, staffId: staffGomathi },
            { day: "Day 2", period: 2, semester: 4, courseId: courseBCAId, subjectId: subEng4, staffId: staffAmuthan },
            { day: "Day 2", period: 3, semester: 4, courseId: courseBCAId, subjectId: subAllied4, staffId: staffMurugesan },
            { day: "Day 2", period: 4, semester: 4, courseId: courseBCAId, subjectId: subEVS, staffId: staffGomathi },
            { day: "Day 2", period: 5, semester: 4, courseId: courseBCAId, subjectId: subTamil4, staffId: staffLatha },
            { day: "Day 2", period: 6, semester: 4, courseId: courseBCAId, subjectId: subLibrary, staffId: null },

            { day: "Day 3", period: 1, semester: 4, courseId: courseBCAId, subjectId: subJava, staffId: staffGomathi },
            { day: "Day 3", period: 2, semester: 4, courseId: courseBCAId, subjectId: subAllied4, staffId: staffMurugesan },
            { day: "Day 3", period: 3, semester: 4, courseId: courseBCAId, subjectId: subEng4, staffId: staffAmuthan },
            { day: "Day 3", period: 4, semester: 4, courseId: courseBCAId, subjectId: subTamil4, staffId: staffLatha },
            { day: "Day 3", period: 5, semester: 4, courseId: courseBCAId, subjectId: subSoftTest, staffId: staffKarthik },
            { day: "Day 3", period: 6, semester: 4, courseId: courseBCAId, subjectId: subLibrary, staffId: null },

            { day: "Day 4", period: 1, semester: 4, courseId: courseBCAId, subjectId: subAllied4, staffId: staffMurugesan },
            { day: "Day 4", period: 2, semester: 4, courseId: courseBCAId, subjectId: subTamil4, staffId: staffLatha },
            { day: "Day 4", period: 3, semester: 4, courseId: courseBCAId, subjectId: subAllied4, staffId: staffMurugesan },
            { day: "Day 4", period: 4, semester: 4, courseId: courseBCAId, subjectId: subEng4, staffId: staffAmuthan },
            { day: "Day 4", period: 5, semester: 4, courseId: courseBCAId, subjectId: subLibrary, staffId: staffGomathi },

            { day: "Day 5", period: 1, semester: 4, courseId: courseBCAId, subjectId: subJava, staffId: staffGomathi },
            { day: "Day 5", period: 2, semester: 4, courseId: courseBCAId, subjectId: subLibrary, staffId: staffGomathi },
            { day: "Day 5", period: 3, semester: 4, courseId: courseBCAId, subjectId: subEng4, staffId: staffAmuthan },
            { day: "Day 5", period: 4, semester: 4, courseId: courseBCAId, subjectId: subTamil4, staffId: staffLatha },
            { day: "Day 5", period: 5, semester: 4, courseId: courseBCAId, subjectId: subAllied4, staffId: staffMurugesan },
            { day: "Day 5", period: 6, semester: 4, courseId: courseBCAId, subjectId: subNM, staffId: staffGomathi },

            { day: "Day 6", period: 1, semester: 4, courseId: courseBCAId, subjectId: subJavaLab, staffId: staffGomathi },
            { day: "Day 6", period: 2, semester: 4, courseId: courseBCAId, subjectId: subJavaLab, staffId: staffGomathi },
            { day: "Day 6", period: 3, semester: 4, courseId: courseBCAId, subjectId: subSoftTest, staffId: staffKavitha },
            { day: "Day 6", period: 4, semester: 4, courseId: courseBCAId, subjectId: subEng4, staffId: staffAmuthan },
            { day: "Day 6", period: 5, semester: 4, courseId: courseBCAId, subjectId: subTamil4, staffId: staffLatha },

            // III BCA (Semester 6)
            { day: "Day 1", period: 1, semester: 6, courseId: courseBCAId, subjectId: subRProgLab, staffId: staffKavitha },
            { day: "Day 1", period: 2, semester: 6, courseId: courseBCAId, subjectId: subRProgLab, staffId: staffKavitha },
            { day: "Day 1", period: 3, semester: 6, courseId: courseBCAId, subjectId: subDBMS, staffId: staffKarthik },
            { day: "Day 1", period: 4, semester: 6, courseId: courseBCAId, subjectId: subIOT, staffId: staffGomathi },

            { day: "Day 2", period: 1, semester: 6, courseId: courseBCAId, subjectId: subCN, staffId: staffEdward },
            { day: "Day 2", period: 2, semester: 6, courseId: courseBCAId, subjectId: subRProg, staffId: staffKavitha },
            { day: "Day 2", period: 3, semester: 6, courseId: courseBCAId, subjectId: subLibrary, staffId: staffEdward },
            { day: "Day 2", period: 4, semester: 6, courseId: courseBCAId, subjectId: subCN, staffId: staffEdward },
            { day: "Day 2", period: 5, semester: 6, courseId: courseBCAId, subjectId: subRProg, staffId: staffKavitha },
            { day: "Day 2", period: 6, semester: 6, courseId: courseBCAId, subjectId: subLibrary, staffId: null },

            { day: "Day 3", period: 2, semester: 6, courseId: courseBCAId, subjectId: subRProg, staffId: staffKavitha },
            { day: "Day 3", period: 3, semester: 6, courseId: courseBCAId, subjectId: subIOT, staffId: staffGomathi },
            { day: "Day 3", period: 4, semester: 6, courseId: courseBCAId, subjectId: subDBMS, staffId: staffKarthik },
            { day: "Day 3", period: 5, semester: 6, courseId: courseBCAId, subjectId: subCN, staffId: staffEdward },
            { day: "Day 3", period: 6, semester: 6, courseId: courseBCAId, subjectId: subIOT, staffId: staffGomathi },

            { day: "Day 4", period: 1, semester: 6, courseId: courseBCAId, subjectId: subCN, staffId: staffEdward },
            { day: "Day 4", period: 2, semester: 6, courseId: courseBCAId, subjectId: subLibrary, staffId: staffEdward },
            { day: "Day 4", period: 3, semester: 6, courseId: courseBCAId, subjectId: subDBMS, staffId: staffKarthik },
            { day: "Day 4", period: 4, semester: 6, courseId: courseBCAId, subjectId: subRProg, staffId: staffKavitha },
            { day: "Day 4", period: 5, semester: 6, courseId: courseBCAId, subjectId: subAdvExcel, staffId: staffEdward },
            { day: "Day 4", period: 6, semester: 6, courseId: courseBCAId, subjectId: subIOT, staffId: staffGomathi },

            { day: "Day 5", period: 1, semester: 6, courseId: courseBCAId, subjectId: subRProgLab, staffId: staffKavitha },
            { day: "Day 5", period: 2, semester: 6, courseId: courseBCAId, subjectId: subRProgLab, staffId: staffKavitha },
            { day: "Day 5", period: 3, semester: 6, courseId: courseBCAId, subjectId: subIOT, staffId: staffGomathi },
            { day: "Day 5", period: 4, semester: 6, courseId: courseBCAId, subjectId: subDBMS, staffId: staffKarthik },
            { day: "Day 5", period: 5, semester: 6, courseId: courseBCAId, subjectId: subCN, staffId: staffEdward },

            { day: "Day 6", period: 1, semester: 6, courseId: courseBCAId, subjectId: subCN, staffId: staffEdward },
            { day: "Day 6", period: 2, semester: 6, courseId: courseBCAId, subjectId: subDBMS, staffId: staffKarthik },
            { day: "Day 6", period: 3, semester: 6, courseId: courseBCAId, subjectId: subRProg, staffId: staffKavitha },
            { day: "Day 6", period: 4, semester: 6, courseId: courseBCAId, subjectId: subAdvExcel, staffId: staffEdward },
            { day: "Day 6", period: 5, semester: 6, courseId: courseBCAId, subjectId: subRProg, staffId: staffKavitha }
        ]);

        console.log("🎉 SUCCESS: All data seeded successfully!");

    } catch (error) {
        console.error("❌ ERROR:", error);
    } finally {
        await mongoose.disconnect();
        console.log("👋 Disconnected.");
    }
}

seedTimetable();