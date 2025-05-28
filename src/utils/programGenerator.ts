import * as z from "zod";

// Define the schema for form validation (needed for the generator function)
const programFormSchemaForGenerator = z.object({
  objectif: z.enum(["Prise de Masse", "Sèche / Perte de Gras", "Powerlifting", "Powerbuilding"]),
  experience: z.enum(["Débutant (< 1 an)", "Intermédiaire (1-3 ans)", "Avancé (3+ ans)"]),
  split: z.enum(["Full Body (Tout le corps)", "Half Body (Haut / Bas)", "Push Pull Legs", "Autre / Pas de préférence"]),
  joursEntrainement: z.coerce.number().min(1).max(7),
  dureeMax: z.coerce.number().min(15).max(180),
  materiel: z.array(z.string()).optional(),
  // New fields for 1RM (optional by default)
  squat1RM: z.coerce.number().optional().nullable(),
  bench1RM: z.coerce.number().optional().nullable(),
  deadlift1RM: z.coerce.number().optional().nullable(),
  ohp1RM: z.coerce.number().optional().nullable(),
  // New fields for RM type (e.g., 1 for 1RM, 5 for 5RM)
  squatRmType: z.coerce.number().optional().nullable(),
  benchRmType: z.coerce.number().optional().nullable(),
  deadliftRmType: z.coerce.number().optional().nullable(),
  ohpRmType: z.coerce.number().optional().nullable(),
  // New field for priority muscle groups
  priorityMuscles: z.array(z.string()).optional(),
  // New field for priority exercises
  priorityExercises: z.array(z.string()).optional(),
  // New field for selected main lifts
  selectedMainLifts: z.array(z.string()).optional(),
}).superRefine((data, ctx) => {
    // Custom validation: If objective is Powerlifting or Powerbuilding, 1RM fields are required and > 0
    if (data.objectif === "Powerlifting" || data.objectif === "Powerbuilding") {
        const mainLiftsToCheck = [
            { field: "squat1RM", rmTypeField: "squatRmType", name: "Squat barre", label: "Squat" },
            { field: "bench1RM", rmTypeField: "benchRmType", name: "Développé couché", label: "Développé Couché" },
            { field: "deadlift1RM", rmTypeField: "deadliftRmType", name: "Soulevé de terre", label: "Soulevé de Terre" },
            { field: "ohp1RM", rmTypeField: "ohpRmType", name: "Développé militaire barre", label: "Overhead Press" },
        ];

        // If specific lifts are selected, their corresponding 1RMs are required.
        if (data.selectedMainLifts && data.selectedMainLifts.length > 0) {
            mainLiftsToCheck.forEach(liftInfo => {
                const rmField = liftInfo.field as keyof typeof data;
                const rmTypeField = liftInfo.rmTypeField as keyof typeof data;

                if (data.selectedMainLifts?.includes(liftInfo.name)) {
                    if (!data[rmField] || (data[rmField] as number) <= 0) {
                        ctx.addIssue({
                            code: z.ZodIssueCode.custom,
                            message: `Veuillez entrer le poids pour votre ${liftInfo.label} (doit être > 0).`,
                            path: [rmField],
                        });
                    }
                    if (!data[rmTypeField] || (data[rmTypeField] as number) <= 0) {
                        ctx.addIssue({
                            code: z.ZodIssueCode.custom,
                            message: `Veuillez sélectionner le type de RM pour votre ${liftInfo.label}.`,
                            path: [rmTypeField],
                        });
                    }
                }
            });
        }
    }
});

// Define a type for the form data used by the generator
export type ProgramFormData = z.infer<typeof programFormSchemaForGenerator>;

// Define types for exercise categories and muscle groups
type ExerciseCategory = "Exercice de powerlifting" | "Compound secondaire" | "Isolation lourde" | "Isolation légère";
// Removed "Lombaires" from MuscleGroup type
type MuscleGroup = "Jambes" | "Pectoraux" | "Dos" | "Épaules" | "Biceps" | "Triceps" | "Abdos" | "Mollets" | "Avant-bras";

// Define a type for an exercise with new fields
interface Exercise {
  name: string;
  category: ExerciseCategory;
  muscleGroup: MuscleGroup; // General muscle group for filtering
  muscles: string[]; // Specific muscles worked
  equipment: string[]; // Equipment needed
}


// Define a type for the program structure
export type Program = {
  title: string;
  description: string;
  is531?: boolean; // Flag to indicate 5/3/1 program
  weeks: {
    weekNumber: number;
    days: {
      dayNumber: number;
      exercises: {
        name: string;
        sets: string; // Still string for display like "3" or "5/3/1"
        reps: string; // Still string for display like "5+" or "3-5"
        notes?: string; // RPE or other notes
        muscles?: string[]; // Muscles worked for display
        // New fields for 5/3/1 sets
        setsDetails?: { // Array of details for each set
            setNumber: number;
            percentage: number; // e.g., 0.65
            calculatedWeight: number; // Weight rounded to 2.5kg
            reps: string; // Specific reps for this set (e.g., "5", "3", "1+")
            isAmrap?: boolean; // Flag for AMRAP set
        }[];
      }[];
    }[];
  }[];
};

// Helper function to round weight to the nearest 2.5 kg
const roundToNearest2_5 = (weight: number): number => {
    return Math.round(weight / 2.5) * 2.5;
};

// Helper function to estimate 1RM using the Epley formula
const estimate1RM = (weight: number, reps: number): number => {
    if (reps === 0) return 0;
    if (reps === 1) return weight;
    return weight * (1 + reps / 30);
};

// --- Updated Exercise List with corrected capitalization, categories, and muscles ---
const allExercises: Exercise[] = [
  // Exercice de powerlifting
  { name: "Squat barre", category: "Exercice de powerlifting", muscleGroup: "Jambes", muscles: ["quadriceps", "fessiers", "lombaires"], equipment: ["barre-halteres"] }, // Kept lombaires as specific muscle
  { name: "Développé couché", category: "Exercice de powerlifting", muscleGroup: "Pectoraux", muscles: ["pectoraux", "triceps", "deltoïdes antérieurs"], equipment: ["barre-halteres"] },
  { name: "Soulevé de terre", category: "Exercice de powerlifting", muscleGroup: "Dos", muscles: ["ischios", "fessiers", "lombaires", "dorsaux", "trapèzes"], equipment: ["barre-halteres"] }, // Kept lombaires as specific muscle
  { name: "Développé militaire barre", category: "Exercice de powerlifting", muscleGroup: "Épaules", muscles: ["épaules", "triceps"], equipment: ["barre-halteres"] },

  // Compound secondaire
  { name: "Développé incliné haltères", category: "Compound secondaire", muscleGroup: "Pectoraux", muscles: ["pectoraux supérieurs", "triceps", "épaules"], equipment: ["barre-halteres"] },
  { name: "Rowing barre", category: "Compound secondaire", muscleGroup: "Dos", muscles: ["dorsaux", "trapèzes", "biceps"], equipment: ["barre-halteres"] },
  { name: "Tractions", category: "Compound secondaire", muscleGroup: "Dos", muscles: ["dorsaux", "biceps"], equipment: ["poids-corps"] },
  { name: "Dips", category: "Compound secondaire", muscleGroup: "Pectoraux", muscles: ["pectoraux", "triceps", "épaules"], equipment: ["poids-corps"] },
  { name: "Presse à cuisses", category: "Compound secondaire", muscleGroup: "Jambes", muscles: ["quadriceps", "fessiers"], equipment: ["machines-guidees"] },
  { name: "Fentes haltères", category: "Compound secondaire", muscleGroup: "Jambes", muscles: ["quadriceps", "fessiers", "ischios"], equipment: ["barre-halteres"] },
  { name: "Tirage vertical machine", category: "Compound secondaire", muscleGroup: "Dos", muscles: ["dorsaux", "biceps"], equipment: ["machines-guidees"] },
  { name: "Pompes", category: "Compound secondaire", muscleGroup: "Pectoraux", muscles: ["pectoraux", "triceps", "épaules"], equipment: [] },
  { name: "Tractions australiennes", category: "Compound secondaire", muscleGroup: "Dos", muscles: ["dorsaux", "biceps", "trapèzes"], equipment: ["poids-corps"] },
  { name: "Split squat bulgare", category: "Compound secondaire", muscleGroup: "Jambes", muscles: ["quadriceps", "fessiers", "ischios"], equipment: ["barre-halteres"] },
  { name: "Soulevé de terre roumain", category: "Compound secondaire", muscleGroup: "Dos", muscles: ["ischios", "fessiers", "lombaires"], equipment: ["barre-halteres"] }, // Added RDL as secondary compound

  // Isolation lourde
  { name: "Leg extension", category: "Isolation lourde", muscleGroup: "Jambes", muscles: ["quadriceps"], equipment: ["machines-guidees"] },
  { name: "Leg curl", category: "Isolation lourde", muscleGroup: "Jambes", muscles: ["ischios"], equipment: ["machines-guidees"] },
  // Removed: { name: "Écartés poulie", category: "Isolation lourde", muscleGroup: "Pectoraux", muscles: ["pectoraux"], equipment: ["machines-guidees"] },
  { name: "Curl biceps barre", category: "Isolation lourde", muscleGroup: "Biceps", muscles: ["biceps"], equipment: ["barre-halteres"] },
  { name: "Extension triceps poulie haute", category: "Isolation lourde", muscleGroup: "Triceps", muscles: ["triceps"], equipment: ["machines-guidees"] },
  { name: "Curl incliné haltères", category: "Isolation lourde", muscleGroup: "Biceps", muscles: ["biceps (longue portion)"], equipment: ["barre-halteres"] },
  { name: "Preacher curl", category: "Isolation lourde", muscleGroup: "Biceps", muscles: ["biceps (courte portion)"], equipment: ["barre-halteres", "machines-guidees"] },
  { name: "Reverse curls", category: "Isolation lourde", muscleGroup: "Biceps", muscles: ["brachial", "avant-bras"], equipment: ["barre-halteres"] },

  // Isolation légère
  { name: "Élévations latérales haltères", category: "Isolation légère", muscleGroup: "Épaules", muscles: ["deltoïdes moyens"], equipment: ["barre-halteres"] },
  { name: "Crunchs", category: "Isolation légère", muscleGroup: "Abdos", muscles: ["abdominaux"], equipment: [] },
  { name: "Leg raises", category: "Isolation légère", muscleGroup: "Abdos", muscles: ["abdominaux inférieurs", "fléchisseurs de hanches"], equipment: [] },
  { name: "Calf raises", category: "Isolation légère", muscleGroup: "Jambes", muscles: ["mollets"], equipment: [] },
  { name: "Face pulls", category: "Isolation légère", muscleGroup: "Dos", muscles: ["deltoïdes postérieurs", "trapèzes", "rotateurs externes"], equipment: ["machines-guidees"] },
  { name: "Pushdowns à la corde", category: "Isolation légère", muscleGroup: "Triceps", muscles: ["triceps"], equipment: ["machines-guidees"] },
  { name: "Élévations latérales à la poulie basse", category: "Isolation légère", muscleGroup: "Épaules", muscles: ["deltoïdes moyens"], equipment: ["machines-guidees"] },
];


// Helper function to filter exercises by available equipment
const filterByEquipment = (exercises: Exercise[], availableEquipment?: string[]): Exercise[] => {
    if (!availableEquipment || availableEquipment.length === 0) {
        // If no equipment selected, only include exercises requiring no equipment
        return exercises.filter(ex => ex.equipment.length === 0);
    }
    return exercises.filter(ex =>
        ex.equipment.length === 0 || ex.equipment.some(eq => availableEquipment.includes(eq))
    );
};

// Helper function to filter exercises by target muscle groups
const filterByMuscleGroups = (exercises: Exercise[], targetMuscleGroups: string[]): Exercise[] => {
    if (!targetMuscleGroups || targetMuscleGroups.length === 0) {
        return exercises; // If no target groups, return all
    }
    return exercises.filter(ex => targetMuscleGroups.includes(ex.muscleGroup));
};

// Define category priority for sorting
const categoryPriority: { [key in ExerciseCategory]: number } = {
    "Exercice de powerlifting": 1,
    "Compound secondaire": 2,
    "Isolation lourde": 3,
    "Isolation légère": 4,
};

// Helper function to shuffle an array
const shuffleArray = <T>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; // Swap elements
    }
    return shuffled;
};


// --- Client-Side Program Generation Logic ---
export const generateProgramClientSide = (values: ProgramFormData): Program => {
  const { objectif, experience, split, joursEntrainement, materiel, dureeMax, squat1RM, bench1RM, deadlift1RM, ohp1RM, squatRmType, benchRmType, deadliftRmType, ohpRmType, priorityMuscles, priorityExercises, selectedMainLifts } = values; // Destructure new field

  // Filter all exercises by available equipment once
  const availableExercises = filterByEquipment(allExercises, materiel);

  // Define common constants
  const maxExercisesPerDay = 8; // Overall limit for exercises per day
  const largeMuscleGroups: MuscleGroup[] = ["Jambes", "Pectoraux", "Dos", "Épaules"]; // Used for volume tracking and general accessory selection

  // Initialize the program structure
  const program: Program = {
      title: "", // Will be set based on objective
      description: "", // Will be set based on objective
      is531: false, // Default to false
      weeks: [],
  };


  // --- 5/3/1 Logic (for Powerlifting and Powerbuilding) ---
  if (objectif === "Powerlifting" || objectif === "Powerbuilding") {
      program.title = `Programme 5/3/1 - ${objectif}`;
      program.description = `Programme basé sur la méthode 5/3/1 de Jim Wendler pour ${joursEntrainement} jours/semaine.`;
      program.is531 = true;


      // Calculate Training Max (TM) for each lift using estimated 1RM
      const trainingMaxes = {
          "Squat barre": (squat1RM && squatRmType) ? roundToNearest2_5(estimate1RM(squat1RM, squatRmType) * 0.9) : 0,
          "Développé couché": (bench1RM && benchRmType) ? roundToNearest2_5(estimate1RM(bench1RM, benchRmType) * 0.9) : 0,
          "Soulevé de terre": (deadlift1RM && deadliftRmType) ? roundToNearest2_5(estimate1RM(deadlift1RM, deadliftRmType) * 0.9) : 0,
          "Développé militaire barre": (ohp1RM && ohpRmType) ? roundToNearest2_5(estimate1RM(ohp1RM, ohpRmType) * 0.9) : 0,
      };

      // 5/3/1 percentages and reps per week
      const cycleWeeks = [
          { week: 1, percentages: [0.65, 0.75, 0.85], reps: ["5", "5", "5+"], amrapSetIndex: 2 }, // 5+
          { week: 2, percentages: [0.70, 0.80, 0.90], reps: ["3", "3", "3+"], amrapSetIndex: 2 }, // 3+
          { week: 3, percentages: [0.75, 0.85, 0.95], reps: ["5", "3", "1+"], amrapSetIndex: 2 }, // 1+
          { week: 4, percentages: [0.40, 0.50, 0.60], reps: ["5", "5", "5"], amrapSetIndex: null }, // Deload
      ];

      // Define all possible main lifts
      const allPossibleMainLifts = ["Squat barre", "Développé couché", "Soulevé de terre", "Développé militaire barre"];
      // Filter main lifts based on user selection
      const mainLiftsForCycle = selectedMainLifts && selectedMainLifts.length > 0
          ? allPossibleMainLifts.filter(lift => selectedMainLifts.includes(lift))
          : []; // If no specific lifts are selected, then no main lifts are included.

      // Distribute main lifts across training days
      const dailyLiftsMap: { [dayIndex: number]: string[] } = {};
      for (let i = 0; i < joursEntrainement; i++) {
          dailyLiftsMap[i] = [];
      }

      // Assign one main lift per day, cycling through available days
      mainLiftsForCycle.forEach((lift, index) => {
          const dayToAssign = index % joursEntrainement; // Cycle through available training days
          dailyLiftsMap[dayToAssign].push(lift);
      });


      // Generate 4 weeks of 5/3/1
      for (const cycleWeek of cycleWeeks) {
          const week: Program['weeks'][number] = {
              weekNumber: cycleWeek.week,
              days: [],
          };

          // Generate days
          for (let dayIndex = 0; dayIndex < joursEntrainement; dayIndex++) {
              const day: Program['weeks'][number]['days'][number] = {
                  dayNumber: dayIndex + 1,
                  exercises: [],
              };

              const liftsForToday = dailyLiftsMap[dayIndex] || []; // Get main lifts for this day
              const potentialDayExercises: Exercise[] = []; // Temporary list to build exercises for the day

              // Add main lifts for the day
              liftsForToday.forEach(liftName => {
                  const tm = trainingMaxes[liftName as keyof typeof trainingMaxes];
                  if (tm !== undefined && tm > 0) { // Only add if TM is valid
                      const setsDetails = cycleWeek.percentages.map((percent, setIdx) => {
                          const calculatedWeight = roundToNearest2_5(tm * percent);
                          const reps = cycleWeek.reps[setIdx]; // Get specific reps for this set
                          const isAmrap = cycleWeek.amrapSetIndex === setIdx; // Check if this is the AMRAP set

                          return {
                              setNumber: setIdx + 1,
                              percentage: percent,
                              calculatedWeight: calculatedWeight,
                              reps: reps,
                              isAmrap: isAmrap,
                          };
                      });

                      // Find the exercise object to get muscle info
                      const exerciseObj = allExercises.find(ex => ex.name === liftName);

                      // Add to potential list as a temporary Exercise object for sorting/filtering
                       potentialDayExercises.push({
                           name: liftName,
                           category: "Exercice de powerlifting", // Assign category for sorting
                           muscleGroup: exerciseObj?.muscleGroup || "Autre", // Assign muscle group
                           muscles: exerciseObj?.muscles || [],
                           equipment: exerciseObj?.equipment || [],
                           // Store 5/3/1 specific data temporarily
                           sets: cycleWeek.percentages.length.toString(),
                           reps: cycleWeek.reps.join('/'),
                           notes: `TM: ${tm} kg`,
                           setsDetails: setsDetails,
                       });
                  }
              });

              // --- Accessory Selection for 5/3/1 ---
              const availableAccessoryExercises = availableExercises.filter(ex =>
                  ex.category === "Compound secondaire" || ex.category === "Isolation lourde" || ex.category === "Isolation légère"
              );

              const numAccessoriesToAdd = objectif === "Powerbuilding" ? 4 : 3; // Powerbuilding gets more accessories
              const addedAccessoryNames = new Set<string>(); // To prevent duplicate accessories on the same day

              // Helper to add accessory exercise if possible
              let exercisesAddedCount = potentialDayExercises.length; // Start count with main lifts
              const addAccessoryIfPossible = (exercise: Exercise) => {
                  if (exercisesAddedCount >= maxExercisesPerDay || addedAccessoryNames.has(exercise.name)) {
                      return false;
                  }
                  // Check if exercise is available with current equipment (already filtered availableExercises)
                  const isAvailable = exercise.equipment.length === 0 || (materiel && materiel.some(eq => exercise.equipment.includes(eq)));
                  if (!isAvailable) {
                      return false;
                  }

                  potentialDayExercises.push({
                      name: exercise.name,
                      category: exercise.category,
                      muscleGroup: exercise.muscleGroup,
                      muscles: exercise.muscles,
                      equipment: exercise.equipment,
                      sets: "3", // Standard 3 sets for accessories
                      reps: "8-12", // Standard rep range for accessories
                      notes: `RPE ${cycleWeek.week === 4 ? 8 : 9}`, // Adjust RPE for deload week
                  });
                  addedAccessoryNames.add(exercise.name);
                  exercisesAddedCount++;
                  return true;
              };

              // Prioritize user-selected priority exercises first
              if (priorityExercises && priorityExercises.length > 0) {
                  const prioritized = shuffleArray(availableAccessoryExercises.filter(ex => priorityExercises.includes(ex.name)));
                  for (const ex of prioritized) {
                      if (addAccessoryIfPossible(ex)) {
                          // If added, continue to next
                      }
                  }
              }

              // Then add accessories based on priority muscles
              if (priorityMuscles && priorityMuscles.length > 0) {
                  const prioritizedByMuscle = shuffleArray(availableAccessoryExercises.filter(ex =>
                      priorityMuscles.includes(ex.muscleGroup) && !addedAccessoryNames.has(ex.name)
                  ));
                  for (const ex of prioritizedByMuscle) {
                      if (addAccessoryIfPossible(ex)) {
                          // If added, continue to next
                      }
                  }
              }

              // Fill remaining slots with random accessories
              const remainingAccessories = shuffleArray(availableAccessoryExercises.filter(ex => !addedAccessoryNames.has(ex.name)));
              for (const ex of remainingAccessories) {
                  if (addAccessoryIfPossible(ex)) {
                      // If added, continue to next
                  }
              }


              // Ensure total exercises don't exceed maxExercisesPerDay
              const finalDayExercises = potentialDayExercises.slice(0, maxExercisesPerDay);


              // Format exercises for the program structure and calculate RPE (only for non-5/3/1 RPE logic)
              day.exercises = finalDayExercises.map(ex => {
                 // For 5/3/1, RPE and setsDetails are already set on the temporary object
                 if (program.is531 && ex.setsDetails) {
                     return {
                         name: ex.name,
                         sets: ex.sets, // Use temporary sets string
                         reps: ex.reps, // Use temporary reps string
                         notes: ex.notes, // Use temporary notes
                         muscles: ex.muscles,
                         setsDetails: ex.setsDetails,
                     };
                 }

                // Non-5/3/1 RPE logic
                let rpeNote = "";
                if (ex.category === "Isolation légère") {
                   rpeNote = "RPE 10"; // Push to failure
                } else if (ex.category === "Isolation lourde") {
                   // RPE progression for heavy isolation: 8 -> 8.5 -> 9 -> 10
                   const rpeMap: { [key: number]: number | string } = { 1: 8, 2: 8.5, 3: 9, 4: 10 };
                   rpeNote = `RPE ${rpeMap[cycleWeek.week] || 8}`; // Use cycleWeek.week for progression
                } else if (ex.category === "Compound secondaire") {
                   // RPE progression for secondary compounds: 7 -> 7.5 -> 8 -> 9
                   const rpeMap: { [key: number]: number | string } = { 1: 7, 2: 7.5, 3: 8, 4: 9 };
                   rpeNote = `RPE ${rpeMap[cycleWeek.week] || 7}`; // Use cycleWeek.week for progression
                } else if (ex.category === "Exercice de powerlifting") {
                   // RPE progression for powerlifting exercises: 6 -> 7 -> 8 -> 10
                   const rpeMap: { [key: number]: number } = { 1: 6, 2: 7, 3: 8, 4: 10 };
                   rpeNote = `RPE ${rpeMap[cycleWeek.week] || 6}`; // Use cycleWeek.week for progression
                }

                return {
                  name: ex.name,
                  sets: "3", // Fixed sets for non-5/3/1
                  reps: objectif === "Sèche / Perte de Gras" ? "12-15" : "8-12", // Fixed reps for non-5/3/1
                  notes: rpeNote,
                  muscles: ex.muscles, // Add muscles worked
                };
              });


              // --- Sort exercises by category priority ---
              day.exercises.sort((a, b) => {
                  const exerciseA = allExercises.find(ex => ex.name === a.name);
                  const exerciseB = allExercises.find(ex => ex.name === b.name);

                  const priorityA = exerciseA ? categoryPriority[exerciseA.category] : 99; // Assign a high priority if not found
                  const priorityB = exerciseB ? categoryPriority[exerciseB.category] : 99; // Assign a high priority if not found

                  return priorityA - priorityB;
              });


              week.days.push(day);
          }
          program.weeks.push(week); // Push the generated week to the program
      }

      // Return the populated 5/3/1 program
      return program;
  }

  // --- Existing Generation Logic (for other objectives: Prise de Masse, Sèche / Perte de Gras) ---
  // This block runs if the objective is NOT Powerlifting or Powerbuilding

  program.title = `Programme ${objectif} - ${joursEntrainement} jours/semaine`;
  program.description = `Programme personnalisé pour votre objectif de ${objectif}.`;


  const baseReps = objectif === "Sèche / Perte de Gras" ? "12-15" : "8-12"; // Simplified reps
  const baseSets = 3; // Use number for calculations

  // Define "big strength" exercises (using updated names) for RPE calculation
  const bigStrengthExercises = ["Squat barre", "Soulevé de terre", "Développé couché", "Développé militaire barre"]; // Updated name

  // Define muscle groups for each split type (using general MuscleGroup type)
  const splitMuscles: { [key: string]: MuscleGroup[][] } = {
      "Full Body (Tout le corps)": [["Jambes", "Pectoraux", "Dos", "Épaules", "Biceps", "Triceps", "Abdos"]], // All muscles each day
      "Half Body (Haut / Bas)": [["Pectoraux", "Dos", "Épaules", "Biceps", "Triceps"], ["Jambes", "Abdos", "Mollets"]], // Upper/Lower split, added Mollets
      "Push Pull Legs": [["Pectoraux", "Épaules", "Triceps"], ["Dos", "Biceps", "Avant-bras"], ["Jambes", "Abdos", "Mollets"]], // PPL split, added Avant-bras, Mollets
      // Removed "Lombaires" from the default split muscles
      "Autre / Pas de préférence": [["Jambes", "Pectoraux", "Dos", "Épaules", "Biceps", "Triceps", "Abdos", "Mollets", "Avant-bras"]], // Default to Full Body logic, include all general groups
  };

  const selectedSplitMuscles = splitMuscles[split] || splitMuscles["Autre / Pas de préférence"];
  const numSplitDays = selectedSplitMuscles.length;

  // Note: The 8-15 sets per muscle per week logic is complex and not fully implemented here.
  // The current logic uses fixed sets per exercise (baseSets = 3).
  // Achieving precise volume targets dynamically would require a more sophisticated algorithm
  // that selects exercises and assigns sets (between 2-4) based on remaining weekly volume needs,
  // while also respecting daily exercise limits and session duration.
  // This is a potential future enhancement.
  const weeklyVolumeCap = 15; // Max sets per week for large muscle groups (used as a soft cap in current logic)


  // Generate 4 weeks
  for (let weekNum = 1; weekNum <= 4; weekNum++) {
    const week: Program['weeks'][number] = {
      weekNumber: weekNum,
      days: [],
    };

    // Initialize weekly volume tracker for this week
    const weeklyVolume: { [key in MuscleGroup]?: number } = {}; // Use MuscleGroup type for keys
    largeMuscleGroups.forEach(group => weeklyVolume[group] = 0);


    // Generate days based on joursEntrainement
    for (let dayIndex = 0; dayIndex < joursEntrainement; dayIndex++) {
      const day: Program['weeks'][number]['days'][number] = {
        dayNumber: dayIndex + 1,
        exercises: [],
      };

      // Determine which muscle groups to target based on the split and day index
      const targetMuscleGroups = selectedSplitMuscles[dayIndex % numSplitDays];

      let dayExercises: Exercise[] = [];
      const addedExerciseNames = new Set<string>(); // To track added exercises

      // Helper to add exercise if possible (simplified for non-5/3/1)
      let exercisesAddedCount = 0; // Reset for each day
      const addSimpleExerciseIfPossible = (exercise: Exercise) => {
           if (exercisesAddedCount >= maxExercisesPerDay || addedExerciseNames.has(exercise.name)) {
               return false;
           }

           // Check if exercise is available with current equipment (already filtered availableExercises)
           const isAvailable = exercise.equipment.length === 0 || (materiel && materiel.some(eq => exercise.equipment.includes(eq)));
           if (!isAvailable) {
               return false;
           }

           // Check volume cap only for large muscle groups
           if (largeMuscleGroups.includes(exercise.muscleGroup)) {
                if ((weeklyVolume[exercise.muscleGroup] || 0) + baseSets > weeklyVolumeCap) {
                    return false; // Cannot add due to cap
                }
                weeklyVolume[exercise.muscleGroup] = (weeklyVolume[exercise.muscleGroup] || 0) + baseSets; // Add sets to weekly volume
           }

           dayExercises.push(exercise);
           addedExerciseNames.add(exercise.name);
           exercisesAddedCount++;
           return true; // Exercise added
       };


      // Filter available exercises for today by target muscle groups
      const availableExercisesForToday = filterByMuscleGroups(availableExercises, targetMuscleGroups);

      // Categorize available exercises for today based on the new categories
      const powerliftingExercises = availableExercisesForToday.filter(ex => ex.category === "Exercice de powerlifting");
      const secondaryCompounds = availableExercisesForToday.filter(ex => ex.category === "Compound secondaire");
      const heavyIsolations = availableExercisesForToday.filter(ex => ex.category === "Isolation lourde");
      const lightIsolations = availableExercisesForToday.filter(ex => ex.category === "Isolation légère");

      // Separate available arm isolation exercises for today
      const availableBicepsIsolationToday = availableExercisesForToday.filter(ex => ex.muscleGroup === "Biceps" && (ex.category === "Isolation lourde" || ex.category === "Isolation légère"));
      const availableTricepsIsolationToday = availableExercisesForToday.filter(ex => ex.muscleGroup === "Triceps" && (ex.category === "Isolation lourde" || ex.category === "Isolation légère"));
      const availableOtherIsolationToday = availableExercisesForToday.filter(ex => ex.muscleGroup !== "Biceps" && ex.muscleGroup !== "Triceps" && (ex.category === "Isolation lourde" || ex.category === "Isolation légère"));


      // --- Add exercises based on category priority, priority muscles, and limits ---
      // Add powerlifting exercises first (up to 1-2 per day if available and targeted)
      shuffleArray(powerliftingExercises).slice(0, Math.min(powerliftingExercises.length, 2)).forEach(addSimpleExerciseIfPossible);

      // Add secondary compounds (up to 2-3 per day if available and targeted)
      shuffleArray(secondaryCompounds).slice(0, Math.min(secondaryCompounds.length, 3)).forEach(addSimpleExerciseIfPossible);

      // --- Arm Isolation Balancing Logic ---
      // Separate biceps exercises into preferred and reverse curls
      const preferredBicepsIsolation = availableBicepsIsolationToday.filter(ex =>
          ["Curl biceps barre", "Curl incliné haltères", "Preacher curl"].includes(ex.name)
      );
      const reverseCurlsIsolation = availableBicepsIsolationToday.filter(ex => ex.name === "Reverse curls");

      // Combine preferred and reverse curls, prioritizing preferred
      const availableBicepsToAdd = [
          ...shuffleArray(preferredBicepsIsolation),
          ...shuffleArray(reverseCurlsIsolation)
      ].filter(ex => !addedExerciseNames.has(ex.name)); // Filter out already added exercises

      const availableTricepsToAdd = availableTricepsIsolationToday.filter(ex => !addedExerciseNames.has(ex.name));
      const shuffledAvailableTriceps = shuffleArray(availableTricepsToAdd);

      // Add biceps and triceps in pairs if possible, prioritizing preferred biceps
      const maxArmPairsToAim = Math.min(Math.floor((maxExercisesPerDay - exercisesAddedCount) / 2), Math.min(availableBicepsToAdd.length, shuffledAvailableTriceps.length));

      for(let i = 0; i < maxArmPairsToAim; i++) {
          addSimpleExerciseIfPossible(availableBicepsToAdd[i]);
          addSimpleExerciseIfPossible(shuffledAvailableTriceps[i]);
      }

      // Add any remaining preferred biceps or triceps if space allows
      const remainingPreferredBiceps = preferredBicepsIsolation.filter(ex => !addedExerciseNames.has(ex.name));
      const remainingTriceps = availableTricepsIsolationToday.filter(ex => !addedExerciseNames.has(ex.name));

      shuffleArray(remainingPreferredBiceps).forEach(addSimpleExerciseIfPossible);
      shuffleArray(remainingTriceps).forEach(addSimpleExerciseIfPossible);


      // Add remaining other isolation exercises (abs, calves, shoulders, etc.)
      const availableOtherIsolationToAdd = availableOtherIsolationToday.filter(ex => !addedExerciseNames.has(ex.name));
      shuffleArray(availableOtherIsolationToAdd).forEach(addSimpleExerciseIfPossible);


      // Ensure total exercises don't exceed maxExercisesPerDay (redundant with addSimpleExerciseIfPossible checks, but safe)
      const finalDayExercises = dayExercises.slice(0, maxExercisesAddedCount); // Use exercisesAddedCount here


      // Format exercises for the program structure and calculate RPE
      day.exercises = finalDayExercises.map(ex => {
        let rpeNote = "";
        // RPE logic based on new categories
        if (ex.category === "Isolation légère") {
           rpeNote = "RPE 10"; // Push to failure
        } else if (ex.category === "Isolation lourde") {
           // RPE progression for heavy isolation: 8 -> 8.5 -> 9 -> 10
           const rpeMap: { [key: number]: number | string } = { 1: 8, 2: 8.5, 3: 9, 4: 10 };
           rpeNote = `RPE ${rpeMap[weekNum] || 8}`;
        } else if (ex.category === "Compound secondaire") {
           // RPE progression for secondary compounds: 7 -> 7.5 -> 8 -> 9
           const rpeMap: { [key: number]: number | string } = { 1: 7, 2: 7.5, 3: 8, 4: 9 };
           rpeNote = `RPE ${rpeMap[weekNum] || 7}`;
        } else if (ex.category === "Exercice de powerlifting") {
           // RPE progression for powerlifting exercises: 6 -> 7 -> 8 -> 10
           const rpeMap: { [key: number]: number } = { 1: 6, 2: 7, 3: 8, 4: 10 };
           rpeNote = `RPE ${rpeMap[weekNum] || 6}`;
        }


        return {
          name: ex.name,
          sets: baseSets.toString(), // Convert back to string for display
          reps: baseReps,
          notes: rpeNote,
          muscles: ex.muscles, // Add muscles worked
        };
      });

      // --- Sort exercises by category priority ---
      day.exercises.sort((a, b) => {
          const exerciseA = allExercises.find(ex => ex.name === a.name);
          const exerciseB = allExercises.find(ex => ex.name === b.name);

          const priorityA = exerciseA ? categoryPriority[exerciseA.category] : 99; // Assign a high priority if not found
          const priorityB = exerciseB ? categoryPriority[exerciseB.category] : 99; // Assign a high priority if not found

          return priorityA - priorityB;
      });


      week.days.push(day);
    }
    program.weeks.push(week); // Push the generated week to the program
  }

  // Return the populated program (for non-5/3/1 objectives)
  return program;
};