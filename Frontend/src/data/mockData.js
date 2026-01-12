export const departments = [
  { id: 1, name: "Computer Science" },
  { id: 2, name: "Electrical Engineering" },
  { id: 3, name: "Mechanical Engineering" },
  { id: 4, name: "Civil Engineering" },
  { id: 5, name: "Electronics & Communication" },
  { id: 6, name: "Instrumentation Engineering" },
  { id: 7, name: "Humanities" },
  { id: 8, name: "Mathematics" },
  { id: 9, name: "Physics" },
  { id: 10, name: "Chemistry" },
];

export const semesters = [
  { id: 1, name: "Semester 1" },
  { id: 2, name: "Semester 2" },
  { id: 3, name: "Semester 3" },
  { id: 4, name: "Semester 4" },
  { id: 5, name: "Semester 5" },
  { id: 6, name: "Semester 6" },
  { id: 7, name: "Semester 7" },
  { id: 8, name: "Semester 8" },
];

export const subjects = [
  // UG 1st Semester (Dec 2024)
  { id: 1, code: "EE 101", name: "Basic Electrical Engineering", departmentId: [3,4,6], semesterId: 1, type: "regular" },
  { id: 2, code: "EC 101", name: "Basic Electronics", departmentId: [1,2,5], semesterId: 1, type: "regular" },
  { id: 3, code: "MA 101", name: "Mathematics I", departmentId: 0, semesterId: 1, type: "regular" },
  { id: 4, code: "PH 101", name: "Physics", departmentId: [3,4,6], semesterId: 1, type: "regular" },
  { id: 5, code: "CH 101", name: "Chemistry", departmentId: [1,2,5], semesterId: 1, type: "regular" },
{ id: 6, code: "HS 101", name: "Communicative English", departmentId: 0, semesterId: 1, type: "regular" },
{ id: 7, code: "CE 102", name: "Environmental Science & Engineering", departmentId: 0, semesterId: 1, type: "regular" },
  { id: 8, code: "ME 101", name: "Engineering Mechanics", departmentId: [3,4,6], semesterId: 1, type: "regular" },
  { id: 9, code: "CS 101", name: "Introduction to Programming", departmentId: [1,2,5], semesterId: 1, type: "regular" },
  { id: 10, code: "CE 101", name: "Engineering Graphics & Design", departmentId: [3,4,6], semesterId: 1, type: "regular" },

  // UG 2nd Semester (May 2025)
{ id: 11, code: "HS 101", name: "Communicative English", departmentId: 0, semesterId: 2, type: "regular" },
{ id: 12, code: "CE 102", name: "Environmental Science and Engineering", departmentId: 0, semesterId: 2, type: "regular" },
  { id: 13, code: "EE 101", name: "Basic Electrical Engineering", departmentId: [1,2,5], semesterId: 2, type: "regular" },
  { id: 14, code: "CH 101", name: "Chemistry", departmentId: [3,4,6], semesterId: 2, type: "regular" },
  { id: 15, code: "CE 101", name: "Engineering Graphics & Design", departmentId: [1,2,5], semesterId: 2, type: "regular" },
  { id: 16, code: "PH 101", name: "Physics", departmentId: [1,2,5], semesterId: 2, type: "regular" },
  { id: 17, code: "EC 101", name: "Basic Electronics", departmentId: [3,4,6], semesterId: 2, type: "regular" },
  { id: 18, code: "ME 101", name: "Engineering Mechanics", departmentId: [1,2,5], semesterId: 2, type: "regular" },
  { id: 19, code: "CS 101", name: "Introduction to Programming", departmentId: [3,4,6], semesterId: 2, type: "regular" },
  { id: 20, code: "MA 102", name: "Mathematics-II", departmentId: 0, semesterId: 2, type: "regular" },

  // UG 3rd Semester (Dec 2024)
  { id: 21, code: "MA 201", name: "Mathematics III", departmentId: 0, semesterId: 3, type: "regular" },
  { id: 22, code: "CE 201", name: "Mechanics of Materials", departmentId: 4, semesterId: 3, type: "regular" },
  { id: 23, code: "CS 201", name: "Data Structure", departmentId: 1, semesterId: 3, type: "regular" },
  { id: 24, code: "CS 222", name: "Data structures & Algorithm", departmentId: 1, semesterId: 3, type: "regular" },
  { id: 25, code: "EE 201", name: "Signals and Systems", departmentId: 2, semesterId: 3, type: "regular" },
  { id: 26, code: "ME 201", name: "Basic Thermodynamics", departmentId: 3, semesterId: 3, type: "regular" },
  { id: 27, code: "CE 202", name: "Civil Engineering Material Testing", departmentId: 4, semesterId: 3, type: "regular" },
  { id: 28, code: "CS 202", name: "Discrete structures", departmentId: 1, semesterId: 3, type: "regular" },
  { id: 29, code: "EE 202", name: "Analog Electronics", departmentId: 2, semesterId: 3, type: "regular" },
  { id: 30, code: "EC 201", name: "Electronic Devices", departmentId: 5, semesterId: 3, type: "regular" },
  { id: 31, code: "EI 201", name: "Electrical and Electronic Measurements", departmentId: 6, semesterId: 3, type: "regular" },
  { id: 32, code: "ME 202", name: "Theory of Machines", departmentId: 3, semesterId: 3, type: "regular" },
  { id: 33, code: "CE 203", name: "Introduction to Geo Sciences", departmentId: 4, semesterId: 3, type: "regular" },
  { id: 34, code: "EE 203", name: "Energy Science and Technology", departmentId: 2, semesterId: 3, type: "regular" },
  { id: 35, code: "EC 202", name: "Analog Electronic Circuits", departmentId: 5, semesterId: 3, type: "regular" },
  { id: 36, code: "EC 221", name: "Electronic Circuits & Switching", departmentId: 5, semesterId: 3, type: "regular" },
  { id: 37, code: "EI 202", name: "Analog Electronics", departmentId: 6, semesterId: 3, type: "regular" },
  { id: 38, code: "ME 203", name: "Fluid Mechanics", departmentId: 3, semesterId: 3, type: "regular" },
  { id: 39, code: "CE 204", name: "Surveying and Geomatics", departmentId: 4, semesterId: 3, type: "regular" },
  { id: 40, code: "EE 204", name: "Measuring Instruments and Measurement", departmentId: 2, semesterId: 3, type: "regular" },
  { id: 41, code: "EC 203", name: "Signals and Systems", departmentId: 5, semesterId: 3, type: "regular" },
  { id: 42, code: "ME 204", name: "Manufacturing Process", departmentId: 3, semesterId: 3, type: "regular" },
  { id: 43, code: "CE 205", name: "Fluid Mechanics", departmentId: 4, semesterId: 3, type: "regular" },
  { id: 44, code: "EE 205", name: "Electromagnetic Field Theory", departmentId: 2, semesterId: 3, type: "regular" },
  { id: 45, code: "EE 221", name: "Network Analysis & Synthesis", departmentId: 2, semesterId: 3, type: "regular" },
  { id: 46, code: "EE 223", name: "Microprocessor", departmentId: 2, semesterId: 3, type: "regular" },
  { id: 47, code: "EI 203", name: "Circuits and Networks", departmentId: 6, semesterId: 3, type: "regular" },
  { id: 48, code: "ME 205", name: "Material Science", departmentId: 3, semesterId: 3, type: "regular" },

  // UG 4th Semester (May 2025)
  { id: 49, code: "CE 206", name: "Structural Analysis - I", departmentId: 4, semesterId: 4, type: "regular" },
  { id: 50, code: "CS 204", name: "Theory of Computation", departmentId: 1, semesterId: 4, type: "regular" },
  { id: 51, code: "EE 206", name: "Electrical Machines - I", departmentId: 2, semesterId: 4, type: "regular" },
  { id: 52, code: "EC 204", name: "Digital Electronic Circuits", departmentId: 5, semesterId: 4, type: "regular" },
  { id: 53, code: "EI 204", name: "Sensors and Transducers", departmentId: 6, semesterId: 4, type: "regular" },
  { id: 54, code: "ME 206", name: "Applied Thermodynamics", departmentId: 3, semesterId: 4, type: "regular" },
  { id: 55, code: "CE 207", name: "Hydraulics", departmentId: 4, semesterId: 4, type: "regular" },
  { id: 56, code: "CS 205", name: "Computer Architecture & Organization", departmentId: 1, semesterId: 4, type: "regular" },
  { id: 57, code: "CS 221", name: "Programming and Data Structure", departmentId: 1, semesterId: 4, type: "regular" },
  { id: 58, code: "EC 205", name: "Analog Communication", departmentId: 5, semesterId: 4, type: "regular" },
  { id: 59, code: "EI 205", name: "Signals and Systems", departmentId: 6, semesterId: 4, type: "regular" },
  { id: 60, code: "ME 207", name: "Fluid Mechanics - II", departmentId: 3, semesterId: 4, type: "regular" },
  { id: 61, code: "CE 208", name: "Design of Concrete Structures - I", departmentId: 4, semesterId: 4, type: "regular" },
  { id: 62, code: "CS 206", name: "Algorithms", departmentId: 1, semesterId: 4, type: "regular" },
  { id: 63, code: "EE 208", name: "Digital Electronics", departmentId: 2, semesterId: 4, type: "regular" },
  { id: 64, code: "EC 206", name: "Control Systems", departmentId: 5, semesterId: 4, type: "regular" },
  { id: 65, code: "EI 206", name: "Control System-I", departmentId: 6, semesterId: 4, type: "regular" },
  { id: 66, code: "ME 208", name: "Mechanics of Solid", departmentId: 3, semesterId: 4, type: "regular" },
  { id: 67, code: "CE 209", name: "Transportation Engineering", departmentId: 4, semesterId: 4, type: "regular" },
  { id: 68, code: "CS 207", name: "Signals & Data Communication", departmentId: 1, semesterId: 4, type: "regular" },
  { id: 69, code: "EE 209", name: "Circuit Theory", departmentId: 2, semesterId: 4, type: "regular" },
  { id: 70, code: "EC 207", name: "Probability and Random Process", departmentId: 5, semesterId: 4, type: "regular" },
  { id: 71, code: "EI 207", name: "Digital Electronics", departmentId: 6, semesterId: 4, type: "regular" },
  { id: 72, code: "ME 209", name: "Instrumentation and Measurement", departmentId: 3, semesterId: 4, type: "regular" },
  { id: 73, code: "CE 210", name: "Geotechnical Engineering", departmentId: 4, semesterId: 4, type: "regular" },
  { id: 74, code: "MA 221", name: "Mathematics-IV", departmentId: 8, semesterId: 4, type: "regular" },
  { id: 75, code: "EE 210", name: "Microprocessors & Microcontrollers", departmentId: 2, semesterId: 4, type: "regular" },
  { id: 76, code: "EC 208", name: "Electrical & Electronic Materials", departmentId: 5, semesterId: 4, type: "regular" },
  { id: 77, code: "EI 208", name: "Power Electronics & Drives", departmentId: 6, semesterId: 4, type: "regular" },
  { id: 78, code: "ME 210", name: "Machining and Machine Tools", departmentId: 3, semesterId: 4, type: "regular" },
  { id: 79, code: "EE 207", name: "Power Systems I", departmentId: 2, semesterId: 4, type: "regular" },
  { id: 80, code: "EC 209", name: "Electromagnetic Fields & Wave Propagation", departmentId: 5, semesterId: 4, type: "regular" },
  { id: 81, code: "ME 217", name: "Energy Science and Technology", departmentId: 3, semesterId: 4, type: "regular" },

  // UG 5th Semester (Dec 2024)
  { id: 82, code: "CE 301", name: "Design of Concrete Structures - II", departmentId: 4, semesterId: 5, type: "regular" },
  { id: 83, code: "CS 301", name: "Computer Network", departmentId: 1, semesterId: 5, type: "regular" },
  { id: 84, code: "EE 301", name: "Control Systems", departmentId: 2, semesterId: 5, type: "regular" },
  { id: 85, code: "EC 301", name: "Digital Communication", departmentId: 5, semesterId: 5, type: "regular" },
  { id: 86, code: "EI 301", name: "Industrial Instrumentation-I", departmentId: 6, semesterId: 5, type: "regular" },
  { id: 87, code: "ME 301", name: "Heat Transfer", departmentId: 3, semesterId: 5, type: "regular" },
  { id: 88, code: "CE 302", name: "Foundation Engineering", departmentId: 4, semesterId: 5, type: "regular" },
  { id: 89, code: "CS 302", name: "Database Management Systems", departmentId: 1, semesterId: 5, type: "regular" },
  { id: 90, code: "EE 302", name: "Power System - II", departmentId: 2, semesterId: 5, type: "regular" },
  { id: 91, code: "EC 302", name: "Microprocessors & Microcontrollers", departmentId: 5, semesterId: 5, type: "regular" },
  { id: 92, code: "EI 302", name: "Microprocessors & Microcontrollers", departmentId: 6, semesterId: 5, type: "regular" },
  { id: 93, code: "ME 302", name: "Machine Design I", departmentId: 3, semesterId: 5, type: "regular" },
  { id: 94, code: "CE 303", name: "Structural Analysis - II", departmentId: 4, semesterId: 5, type: "regular" },
  { id: 95, code: "CS 303", name: "Operating System", departmentId: 1, semesterId: 5, type: "regular" },
  { id: 96, code: "EE 303", name: "Electrical Machines II", departmentId: 2, semesterId: 5, type: "regular" },
  { id: 97, code: "EC 303", name: "Analog Integrated Circuits & Technology", departmentId: 5, semesterId: 5, type: "regular" },
  { id: 98, code: "EI 303", name: "Biomedical Instrumentation", departmentId: 6, semesterId: 5, type: "regular" },
  { id: 99, code: "ME 303", name: "Turbo Machinery", departmentId: 3, semesterId: 5, type: "regular" },
  { id: 100, code: "CE 304", name: "Surface and Ground Water Hydrology", departmentId: 4, semesterId: 5, type: "regular" },
  { id: 101, code: "CS 304", name: "Software Engineering", departmentId: 1, semesterId: 5, type: "regular" },
  { id: 102, code: "EE 304", name: "Power Electronics", departmentId: 2, semesterId: 5, type: "regular" },
  { id: 103, code: "EC 304", name: "Digital Signal Processing", departmentId: 5, semesterId: 5, type: "regular" },
  { id: 104, code: "EI 304", name: "Control System-II", departmentId: 6, semesterId: 5, type: "regular" },
  { id: 105, code: "ME 304", name: "Advanced Solid Mechanics", departmentId: 3, semesterId: 5, type: "regular" },
  { id: 106, code: "CE 305", name: "Water Supply Engineering", departmentId: 4, semesterId: 5, type: "regular" },
  { id: 107, code: "CS 305", name: "Graph Theory", departmentId: 1, semesterId: 5, type: "regular" },
  { id: 108, code: "EE 305", name: "Digital Signal Processing", departmentId: 2, semesterId: 5, type: "regular" },
  { id: 109, code: "EC 305", name: "Electronic Measurements and Instrumentation", departmentId: 5, semesterId: 5, type: "regular" },
  { id: 110, code: "EI 305", name: "Communication & Telemetry", departmentId: 6, semesterId: 5, type: "regular" },
  { id: 111, code: "ME 305", name: "IC Engine", departmentId: 3, semesterId: 5, type: "regular" },
  { id: 112, code: "EC 306", name: "Principles of Opto-Electronics and Fibre optics", departmentId: 5, semesterId: 5, type: "regular" },
  { id: 113, code: "ME 306", name: "Advanced Manufacturing Processes", departmentId: 3, semesterId: 5, type: "regular" },

  // UG 6th Semester (May 2025) - Core Electives and Open Electives
  { id: 114, code: "CE 306", name: "Civil Engineering Estimation", departmentId: 4, semesterId: 6, type: "regular" },
  { id: 115, code: "CS 306", name: "Principles of Programming Language", departmentId: 1, semesterId: 6, type: "regular" },
  { id: 116, code: "EE 306", name: "Switchgear and Protection", departmentId: 2, semesterId: 6, type: "regular" },
  { id: 117, code: "EC 307", name: "RF and Microwave Engineering", departmentId: 5, semesterId: 6, type: "regular" },
  { id: 118, code: "EI 306", name: "Industrial Instrumentation-II", departmentId: 6, semesterId: 6, type: "regular" },
  { id: 119, code: "ME 307", name: "Machine Design  II", departmentId: 3, semesterId: 6, type: "regular" },
  { id: 120, code: "CE 307", name: "Design of Steel Structures", departmentId: 4, semesterId: 6, type: "regular" },
  { id: 121, code: "CS 307", name: "Compiler Design", departmentId: 1, semesterId: 6, type: "regular" },
  { id: 122, code: "EE 307", name: "Industrial Drives", departmentId: 2, semesterId: 6, type: "regular" },
  { id: 123, code: "EC 308", name: "Data Communication and Network", departmentId: 5, semesterId: 6, type: "regular" },
  { id: 124, code: "EI 307", name: "Process Control Engineering", departmentId: 6, semesterId: 6, type: "regular" },
  { id: 125, code: "ME 308", name: "Automobile Engineering", departmentId: 3, semesterId: 6, type: "regular" },
  { id: 126, code: "CE 308", name: "Sewage Treatment and Disposal", departmentId: 4, semesterId: 6, type: "regular" },
  { id: 127, code: "CS 308", name: "Graphics and Multimedia", departmentId: 1, semesterId: 6, type: "regular" },
  { id: 128, code: "EE 308", name: "Modern Control Systems", departmentId: 2, semesterId: 6, type: "regular" },
  { id: 129, code: "EC 309", name: "VLSI Design", departmentId: 5, semesterId: 6, type: "regular" },
  { id: 130, code: "EI 308", name: "Digital Signal Processing", departmentId: 6, semesterId: 6, type: "regular" },
  { id: 131, code: "ME 309", name: "Power Plant Engineering", departmentId: 3, semesterId: 6, type: "regular" },

  // Open Electives - 6th Semester
  { id: 132, code: "CE 381", name: "Modeling, Simulation and Application", departmentId: 4, semesterId: 6, type: "open_elective" },
  { id: 133, code: "CE 382", name: "Remote Sensing and GIS", departmentId: 4, semesterId: 6, type: "open_elective" },
  { id: 134, code: "CS 382", name: "Introduction to Blockchain", departmentId: 1, semesterId: 6, type: "open_elective" },
  { id: 135, code: "EE 381", name: "Optimization Methods and its Application", departmentId: 2, semesterId: 6, type: "open_elective" },
  { id: 136, code: "EE 385", name: "Software-based System Design", departmentId: 2, semesterId: 6, type: "open_elective" },
  { id: 137, code: "EC 382", name: "Neural Network and Fuzzy Logic", departmentId: 5, semesterId: 6, type: "open_elective" },
  { id: 138, code: "EC 386", name: "Digital Image Processing", departmentId: 5, semesterId: 6, type: "open_elective" },
  { id: 139, code: "EC 389", name: "IPR and innovation", departmentId: 5, semesterId: 6, type: "open_elective" },
  { id: 140, code: "EI 381", name: "Air Pollution and Environmental Instrumentation", departmentId: 6, semesterId: 6, type: "open_elective" },
  { id: 141, code: "EI 383", name: "Opto-Electronics and Fibre Optics", departmentId: 6, semesterId: 6, type: "open_elective" },
  { id: 142, code: "ME 381", name: "COMPUTATIONAL FLUID DYNAMICS", departmentId: 3, semesterId: 6, type: "open_elective" },
  { id: 143, code: "ME 383", name: "Reliability Engineering", departmentId: 3, semesterId: 6, type: "open_elective" },
  { id: 144, code: "ME 384", name: "Renewable Energy", departmentId: 3, semesterId: 6, type: "open_elective" },
  { id: 159, code: "ME 5138", name: "Additive Manufacturing", departmentId: 3, semesterId: 6, type: "open_elective" },
  { id: 160, code: "ME 5438", name: "Computational Methods in Thermal Engineering", departmentId: 3, semesterId: 6, type: "open_elective" },
  { id: 161, code: "ME 5505", name: "Biomass and Bioenergy", departmentId: 3, semesterId: 6, type: "open_elective" },

  // Core Electives - 6th Semester
  { id: 145, code: "CE 331", name: "Soil Dynamics and Machine Foundation", departmentId: 4, semesterId: 6, type: "core_elective" },
  { id: 146, code: "CE 332", name: "Water Resources and Irrigation Engineering", departmentId: 4, semesterId: 6, type: "core_elective" },
  { id: 147, code: "CE 334", name: "Railway and Bridge Engineering", departmentId: 4, semesterId: 6, type: "core_elective" },
  { id: 148, code: "CS 331", name: "Social Network Analysis", departmentId: 1, semesterId: 6, type: "core_elective" },
  { id: 149, code: "CS 332", name: "Natural Language Processing", departmentId: 1, semesterId: 6, type: "core_elective" },
  { id: 150, code: "CS 333", name: "Digital Image Processing", departmentId: 1, semesterId: 6, type: "core_elective" },
  { id: 151, code: "EE 331", name: "Digital Control Systems", departmentId: 2, semesterId: 6, type: "core_elective" },
  { id: 152, code: "EE 335", name: "Introduction to VLSI", departmentId: 2, semesterId: 6, type: "core_elective" },
  { id: 153, code: "EC 333", name: "Simulation of Device and Circuits", departmentId: 5, semesterId: 6, type: "core_elective" },
  { id: 154, code: "EC 337", name: "Mobile and Cellular Communication", departmentId: 5, semesterId: 6, type: "core_elective" },
  { id: 155, code: "EI 332", name: "Power Plant Instrumentation", departmentId: 6, semesterId: 6, type: "core_elective" },
  { id: 156, code: "EI 338", name: "Drone Technology", departmentId: 6, semesterId: 6, type: "core_elective" },
  { id: 157, code: "ME 338", name: "Gas Turbine and Jet Propulsion", departmentId: 3, semesterId: 6, type: "core_elective" },
  { id: 158, code: "ME 339", name: "Metal Cutting and Cutting Tool Design", departmentId: 3, semesterId: 6, type: "core_elective" },
  { id: 162, code: "CE 309", name: "Structural Analysis - III", departmentId: 4, semesterId: 6, type: "core_elective" },
  { id: 163, code: "EC 327", name: "Analog and Digital Communication", departmentId: 5, semesterId: 6, type: "core_elective" },
  { id: 164, code: "EC 310", name: "Power Electronics", departmentId: 5, semesterId: 6, type: "core_elective" },
  { id: 165, code: "ME 310", name: "Dynamics and Control of Machinery", departmentId: 3, semesterId: 6, type: "core_elective" },

  // UG 7th Semester (Dec 2024) - Core Electives and Open Electives
  { id: 166, code: "HS 401", name: "Managerial economics", departmentId: 7, semesterId: 7, type: "open_elective" },
  { id: 167, code: "MS 401", name: "Business Management", departmentId: 11, semesterId: 7, type: "open_elective" },
  { id: 168, code: "EE 436", name: "Modelling and Control of AC Drives", departmentId: 2, semesterId: 7, type: "core_elective" },
  { id: 169, code: "CE 401", name: "Concrete Technology", departmentId: 4, semesterId: 7, type: "regular" },
  { id: 170, code: "CS 401", name: "Artificial Intelligence", departmentId: 1, semesterId: 7, type: "regular" },
  { id: 171, code: "EE 401", name: "Instrumentation", departmentId: 2, semesterId: 7, type: "regular" },
  { id: 172, code: "EC 401", name: "Wireless Communication", departmentId: 5, semesterId: 7, type: "regular" },
  { id: 173, code: "EI 401", name: "Analytical and Optical Instrumentation", departmentId: 6, semesterId: 7, type: "regular" },
  { id: 174, code: "ME 401", name: "Industrial Engineering and Operations Research", departmentId: 3, semesterId: 7, type: "regular" },

  // Core Electives - 7th Semester
  { id: 175, code: "CE 432", name: "Advanced Structural Analysis", departmentId: 4, semesterId: 7, type: "core_elective" },
  { id: 176, code: "CE 433", name: "Advanced Foundation Engineering", departmentId: 4, semesterId: 7, type: "core_elective" },
  { id: 177, code: "CE 435", name: "Open Channel Flow", departmentId: 4, semesterId: 7, type: "core_elective" },
  { id: 178, code: "CS 431", name: "Machine Learning", departmentId: 1, semesterId: 7, type: "core_elective" },
  { id: 179, code: "CS 432", name: "Pattern Recognition", departmentId: 1, semesterId: 7, type: "core_elective" },
  { id: 180, code: "CS 434", name: "Cryptography and Security", departmentId: 1, semesterId: 7, type: "core_elective" },
  { id: 181, code: "EE 448", name: "VLSI System Design", departmentId: 2, semesterId: 7, type: "core_elective" },
  { id: 182, code: "EE 449", name: "Distributed Generation with Wind Energy Conversion", departmentId: 2, semesterId: 7, type: "core_elective" },
  { id: 183, code: "EE 5101", name: "Linear control Theory", departmentId: 2, semesterId: 7, type: "core_elective" },
  { id: 184, code: "EE 5202", name: "Non-conventional energy source and energy converter", departmentId: 2, semesterId: 7, type: "core_elective" },
  { id: 185, code: "EC 433", name: "Wireless Sensor Network", departmentId: 5, semesterId: 7, type: "core_elective" },
  { id: 186, code: "EC 437", name: "Satellite Communications", departmentId: 5, semesterId: 7, type: "core_elective" },
  { id: 187, code: "EI 434", name: "IOT based Instrumentation", departmentId: 6, semesterId: 7, type: "core_elective" },
  { id: 188, code: "EI 435", name: "MEMS and Nano Technology", departmentId: 6, semesterId: 7, type: "core_elective" },
  { id: 189, code: "EI 432", name: "Biomedical Signal Processing", departmentId: 6, semesterId: 7, type: "core_elective" },
  { id: 190, code: "ME 431", name: "Advanced Machining Processes", departmentId: 3, semesterId: 7, type: "core_elective" },
  { id: 191, code: "ME 433", name: "Fundamentals of Industrial Design", departmentId: 3, semesterId: 7, type: "core_elective" },
  { id: 192, code: "ME 434", name: "Viscous Fluid Flow", departmentId: 3, semesterId: 7, type: "core_elective" },
  { id: 193, code: "ME 5202", name: "Computer Aided Design", departmentId: 3, semesterId: 7, type: "core_elective" },

  // Open Electives - 7th Semester
  { id: 194, code: "CS 486", name: "Introduction to Neural Network and Deep Learning", departmentId: 1, semesterId: 7, type: "open_elective" },
  { id: 195, code: "EE 5131", name: "Modelling of Dynamical Systems", departmentId: 2, semesterId: 7, type: "open_elective" },
  { id: 196, code: "EC 481", name: "Machine Learning", departmentId: 5, semesterId: 7, type: "open_elective" },
  { id: 197, code: "EC 482", name: "Information Theory and Coding", departmentId: 5, semesterId: 7, type: "open_elective" },
  { id: 198, code: "EC 485", name: "Selected Topics on VLSI", departmentId: 5, semesterId: 7, type: "open_elective" },
  { id: 199, code: "EE 5102", name: "Industrial Automation", departmentId: 2, semesterId: 7, type: "open_elective" },
  { id: 200, code: "EE 5201", name: "Power System Analysis", departmentId: 2, semesterId: 7, type: "open_elective" },
  { id: 201, code: "CS 481", name: "Web Technology", departmentId: 1, semesterId: 7, type: "open_elective" },
  { id: 202, code: "EI 481", name: "Robotics and Automation", departmentId: 6, semesterId: 7, type: "open_elective" },
  { id: 203, code: "EI 483", name: "Neural Networks and Fuzzy logic", departmentId: 6, semesterId: 7, type: "open_elective" },
  { id: 204, code: "EI 484", name: "Renewable Energy Systems", departmentId: 6, semesterId: 7, type: "open_elective" },
  { id: 205, code: "CE 482", name: "Numerical Methods in Engineering", departmentId: 4, semesterId: 7, type: "open_elective" },
  { id: 206, code: "CE 483", name: "Introduction to Traffic Engineering", departmentId: 4, semesterId: 7, type: "open_elective" },
  { id: 207, code: "EE 5103", name: "Digital Image Processing and Applications", departmentId: 2, semesterId: 7, type: "open_elective" },
  { id: 208, code: "ME 481", name: "Battery & Fuel Cell Technology", departmentId: 3, semesterId: 7, type: "open_elective" },
  { id: 209, code: "ME 486", name: "Supply Chain Management", departmentId: 3, semesterId: 7, type: "open_elective" },
  { id: 210, code: "EE 5141", name: "Industrial Instrumentation", departmentId: 2, semesterId: 7, type: "open_elective" },
  { id: 211, code: "EE 5232", name: "HVDC & FACTS Devices", departmentId: 2, semesterId: 7, type: "open_elective" },
  { id: 212, code: "EE 5233", name: "Power Quality", departmentId: 2, semesterId: 7, type: "open_elective" },
  { id: 213, code: "EE 5237", name: "Smart Grid", departmentId: 2, semesterId: 7, type: "open_elective" },
  { id: 214, code: "ME 5232", name: "Advanced Mechatronics", departmentId: 3, semesterId: 7, type: "open_elective" },

  // UG 8th Semester (May 2025) - Core Electives and Open Electives
  // Open Electives - 8th Semester
  { id: 215, code: "CE 491", name: "Finite Element Methods in Engineering", departmentId: 4, semesterId: 8, type: "open_elective" },
  { id: 216, code: "CE 492", name: "Optimization Techniques", departmentId: 4, semesterId: 8, type: "open_elective" },
  { id: 217, code: "CS 484", name: "Cloud Computing", departmentId: 1, semesterId: 8, type: "open_elective" },
  { id: 218, code: "EE 492", name: "Soft Computing Techniques and Applications", departmentId: 2, semesterId: 8, type: "open_elective" },
  { id: 219, code: "EE 494", name: "Control System Components", departmentId: 2, semesterId: 8, type: "open_elective" },
  { id: 220, code: "EC 495", name: "Selected Topics on Image Processing", departmentId: 5, semesterId: 8, type: "open_elective" },
  { id: 221, code: "EC 496B", name: "Deep Learning and Applications", departmentId: 5, semesterId: 8, type: "open_elective" },
  { id: 222, code: "EI 490", name: "Intelligent Instrumentation", departmentId: 6, semesterId: 8, type: "open_elective" },
  { id: 223, code: "EI 493", name: "Advanced Memory Technology", departmentId: 6, semesterId: 8, type: "open_elective" },
  { id: 224, code: "ME 492", name: "MEMS and Nanotechnology", departmentId: 3, semesterId: 8, type: "open_elective" },
  { id: 225, code: "ME 494", name: "Pollution Control and Management", departmentId: 3, semesterId: 8, type: "open_elective" },
  { id: 226, code: "ME 5106", name: "Robotics and Automation", departmentId: 3, semesterId: 8, type: "open_elective" },
  { id: 227, code: "ME 5506", name: "Solar Photovoltaic System", departmentId: 3, semesterId: 8, type: "open_elective" },
  { id: 240, code: "ME 5205", name: "Production and Operations Management", departmentId: 3, semesterId: 8, type: "open_elective" },
  { id: 246, code: "ME 5305", name: "Mechanical Metallurgy", departmentId: 3, semesterId: 8, type: "open_elective" },
  { id: 247, code: "ME 5406", name: "Convective Heat Transfer Analysis", departmentId: 3, semesterId: 8, type: "open_elective" },

  // Core Electives - 8th Semester
  { id: 228, code: "CE 451", name: "Earthquake Resistant Design of Structures", departmentId: 4, semesterId: 8, type: "core_elective" },
  { id: 229, code: "CE 453", name: "Hydraulic Structures", departmentId: 4, semesterId: 8, type: "core_elective" },
  { id: 230, code: "CE 455", name: "Construction Engineering and Management", departmentId: 4, semesterId: 8, type: "core_elective" },
  { id: 231, code: "CS 442", name: "Wireless Sensor Network", departmentId: 1, semesterId: 8, type: "core_elective" },
  { id: 232, code: "CS 444", name: "Information Theory and Coding", departmentId: 1, semesterId: 8, type: "core_elective" },
  { id: 233, code: "EE 455", name: "Advanced Control Systems", departmentId: 2, semesterId: 8, type: "core_elective" },
  { id: 234, code: "EE 469", name: "Non-Conventional and Distributed Generation", departmentId: 2, semesterId: 8, type: "core_elective" },
  { id: 235, code: "EC 452", name: "Advanced Communication Engineering", departmentId: 5, semesterId: 8, type: "core_elective" },
  { id: 236, code: "EC 453", name: "Advanced wireless Communications", departmentId: 5, semesterId: 8, type: "core_elective" },
  { id: 237, code: "EC 454", name: "Low Power VLSI Design", departmentId: 5, semesterId: 8, type: "core_elective" },
  { id: 238, code: "EI 443", name: "Industrial Automation", departmentId: 6, semesterId: 8, type: "core_elective" },
  { id: 239, code: "EI 447", name: "Mechatronics", departmentId: 6, semesterId: 8, type: "core_elective" },
  { id: 241, code: "ME 451", name: "Computer Integrated Manufacturing", departmentId: 3, semesterId: 8, type: "core_elective" },
  { id: 242, code: "ME 452", name: "Condition Monitoring of Manufacturing Processes", departmentId: 3, semesterId: 8, type: "core_elective" },
  { id: 243, code: "ME 453", name: "Engineering Fracture Mechanics", departmentId: 3, semesterId: 8, type: "core_elective" },
  { id: 244, code: "ME 454", name: "Heat transfer application in biological systems", departmentId: 3, semesterId: 8, type: "core_elective" },
  { id: 245, code: "ME 456", name: "Two phase flow", departmentId: 3, semesterId: 8, type: "core_elective" },
];

// Get core electives for a department and semester
export const getCoreElectivesByDepartment = (departmentId, semesterId) =>
  subjects.filter(
    s =>
      s.type === 'core_elective' &&
      (
        (Array.isArray(s.departmentId) && s.departmentId.includes(departmentId)) ||
        s.departmentId === departmentId
      ) &&
      s.semesterId === semesterId
  );

// Get open electives for a given semester
export const getOpenElectivesBySemester = semesterId =>
  subjects.filter(
    s => s.type === 'open_elective' && s.semesterId === semesterId
  );

// Get regular subjects for a department and semester (with foundation/0 support)
export const getRegularSubjects = (departmentId, semesterId) =>
  subjects.filter(
    s =>
      s.type === 'regular' &&
      (
        (Array.isArray(s.departmentId) && s.departmentId.includes(departmentId)) ||
        s.departmentId === departmentId ||
        s.departmentId === 0 // include common/foundation subjects
      ) &&
      s.semesterId === semesterId
  );

export const classrooms = [
  { id: 1, name: "Room 101", capacity: 100 },
  { id: 2, name: "Room 102", capacity: 100 },
  { id: 3, name: "Room 201", capacity: 200 },
  { id: 4, name: "Room 202", capacity: 150 },
  { id: 5, name: "Gallery 301", capacity: 100 },
  { id: 6, name: "Gallery 302", capacity: 100 },
  { id: 7, name: "Gallery 303", capacity: 100 },
  { id: 8, name: "Gallery 304", capacity: 100 },
  { id: 9, name: "Gallery 305", capacity: 100 },
  { id: 10, name: "Gallery 306", capacity: 100 },
  { id: 11, name: "Gallery 307", capacity: 100 },
  { id: 12, name: "INDO 3", capacity: 100 },
];


export const invigilators = [
  // From both PDF files
  { id: 1, name: "Dr. Shashi Kumar GK", workload: 2 },
  { id: 2, name: "Dr. V. V. Kulkarni", workload: 1 },
  { id: 3, name: "Dr. Sreejith.S", workload: 3 },
  { id: 4, name: "DR. S G PATRA", workload: 2 },
  { id: 5, name: "Prof. Parthajit Roy", workload: 1 },
  { id: 6, name: "Dr. P. Srinivasan", workload: 2 },
  { id: 7, name: "Dr. Bijit Choudhuri", workload: 2 },
  { id: 8, name: "Dr. P. Choudhury", workload: 3 },
  { id: 9, name: "Dr. R. Patgiri", workload: 2 },
  { id: 10, name: "Dr. Avijit Das", workload: 1 },
  { id: 11, name: "Prof. A. I. Laskar", workload: 2 },
  { id: 12, name: "Mr. Pantha Kanti Nath", workload: 1 },
  { id: 13, name: "Dr. L C Saikia", workload: 2 },
  { id: 14, name: "Dr. U Chakraborty", workload: 1 },
  { id: 15, name: "Dr. Vipin C. Pal", workload: 2 },
  { id: 16, name: "Dr. A. Biswas", workload: 2 },
  { id: 17, name: "Dr. B. S. Sil", workload: 1 },
  { id: 18, name: "Dr. Ujwala Baruah", workload: 2 },
  { id: 19, name: "Dr. Ramanujam E.", workload: 1 },
  { id: 20, name: "Dr. M Banerjee", workload: 2 },
  // ... (add all remaining invigilators from both PDFs)
  
  // Management faculty
  { id: 101, name: "Dr. Binoti Patro", workload: 2 },
  { id: 102, name: "Dr. Saurabh Verma", workload: 1 },
  { id: 103, name: "Dr. Ashim Kumar Das", workload: 3 },
  { id: 104, name: "Dr. Dibya Nandan Mishra", workload: 2 },
  { id: 105, name: "Dr. Tanaya Nayak", workload: 2 },
  { id: 106, name: "Dr. Soma Panja", workload: 1 },
  
  // Science faculty
  { id: 201, name: "Prof. M Sen", workload: 2 },
  { id: 202, name: "Dr. Snehasish Nandy", workload: 1 },
  { id: 203, name: "Dr. BHS Raju", workload: 2 },
  { id: 204, name: "Dr. P.K. Gupta", workload: 1 },
  { id: 205, name: "Prof. P. Barman", workload: 2 },
  { id: 206, name: "Prof. M.A. Zaman", workload: 2 },
  { id: 207, name: "Dr. Susmita Rabha", workload: 1 },
  { id: 208, name: "Dr. Rupak Dutta", workload: 2 },
  { id: 209, name: "Prof. S. S. Dhar", workload: 1 },
];