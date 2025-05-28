import * as z from "zod";

// Define the schema for form validation (needed for the generator function)
const programFormSchemaForGenerator = z.object({
  objectif: z.enum(["Prise de Masse", "Sèche / Perte de Gras", "Powerlifting", "Powerbuilding"]),
  experience: z.enum(["Débutant (< 1 an)", "Intermédiaire (1-3 ans)", "Avancé (3+ ans)"]),
  // Removed 'split' from schema
  joursEntrainement: z.coerce.number().min(1).max(6), // Max 6 days now
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
            { field: "bench1RM", rmType: "benchRmType", name: "Développé couché", label: "Développé Couché" },
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
  { name: "Squat barre", category: "Exercice de powerlifting", muscleGroup: "Jambes", muscles: ["quadriceps", "fessiers", "lombaires"], equipment: ["barre-halteres"] },
  { name: "Développé couché", category: "Exercice de powerlifting", muscleGroup: "Pectoraux", muscles: ["pectoraux", "triceps", "deltoïdes antérieurs"], equipment: ["barre-halteres"] },
  { name: "Soulevé de terre", category: "Exercice de powerlifting", muscleGroup: "Dos", muscles: ["ischios", "fessiers", "lombaires", "dorsaux", "trapèzes"], equipment: ["barre-halteres"] },
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
  { name: "Soulevé de terre roumain", category: "Compound secondaire", muscleGroup: "Dos", muscles: ["ischios", "fessiers", "lombaires"], equipment: ["barre-halteres"] },

  // Isolation lourde
  { name: "Leg extension", category: "Isolation lourde", muscleGroup: "Jambes", muscles: ["quadriceps"], equipment: ["machines-guidees"] },
  { name: "Leg curl", category: "Isolation lourde", muscleGroup: "Jambes", muscles: ["ischios"], equipment: ["machines-guidees"] },
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
  const { objectif, experience, joursEntrainement, materiel, dureeMax, squat1RM, bench1RM, deadlift1RM, ohp1RM, squatRmType, benchRmType, deadliftRmType, ohpRmType, priorityMuscles, priorityExercises, selectedMainLifts } = values;

  // Determine the split type based on joursEntrainement
  let determinedSplit: "Full Body (Tout le corps)" | "Half Body (Haut / Bas)" | "Push Pull Legs" | "Autre / Pas de préférence";
  if (joursEntrainement >= 1 && joursEntrainement <= 3) {
      determinedSplit = "Full Body (Tout le corps)";
  } else if (joursEntrainement === 4 || joursEntrainement === 5) {
      determinedSplit = "Half Body (Haut / Bas)";
  } else if (joursEntrainement === 6) {
      determinedSplit = "Push Pull Legs";
  } else {
      determinedSplit = "Autre / Pas de préférence"; // Fallback, though schema limits to 6
  }


  // Filter all exercises by available equipment once
  const availableExercises = filterByEquipment(allExercises, materiel);

  // Define common constants
  const maxExercisesPerDay = 8; // Overall limit for exercises per day
  // Groups subject to the 2-exercise per day limit
  const limitedDailyExerciseGroups: MuscleGroup[] = ["Jambes", "Pectoraux", "Dos"];

  // Define a pool of accessory exercises available for selection
  const availableAccessoryExercises = availableExercises.filter(ex =>
      ex.category === "Compound secondaire" || ex.category === "Isolation lourde" || ex.category === "Isolation légère"
  );

  // Initialize the program structure
  const program: Program = {
      title: "",
      description: "",
      is531: false,
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
          : [];

      // Distribute main lifts across training days
      const dailyLiftsMap: { [dayIndex: number]: string[] } = {};
      for (let i = 0; i < joursEntrainement; i++) {
          dailyLiftsMap[i] = [];
      }

      // Assign one main lift per day, cycling through available days
      mainLiftsForCycle.forEach((lift, index) => {
          const dayToAssign = index % joursEntrainement;
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
              const day: Program['weeks'][number']['days'][number] = {
                  dayNumber: dayIndex + 1,
                  exercises: [],
              };

              const liftsForToday = dailyLiftsMap[dayIndex] || [];
              const potentialDayExercises: Exercise[] = [];
              const muscleGroupDailyCount: { [key: string]: number } = {};

              // Helper to check if an exercise can be added without modifying state
              const canAddExercise = (exercise: Exercise, currentExercisesCount: number, currentAddedNames: Set<string>, currentMuscleGroupCounts: { [key: string]: number }): boolean => {
                  if (currentExercisesCount >= maxExercisesPerDay || currentAddedNames.has(exercise.name)) {
                      return false;
                  }
                  const isAvailable = exercise.equipment.length === 0 || (materiel && materiel.some(eq => exercise.equipment.includes(eq)));
                  if (!isAvailable) {
                      return false;
                  }
                  if (limitedDailyExerciseGroups.includes(exercise.muscleGroup)) {
                      const currentCount = currentMuscleGroupCounts[exercise.muscleGroup] || 0;
                      if (currentCount >= 2) {
                          return false;
                      }
                  }
                  return true;
              };

              // Helper to actually add an exercise and update state
              const commitAddExercise = (exercise: Exercise) => {
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
                  if (limitedDailyExerciseGroups.includes(exercise.muscleGroup)) {
                      muscleGroupDailyCount[exercise.muscleGroup] = (muscleGroupDailyCount[exercise.muscleGroup] || 0) + 1;
                  }
              };

              // Add main lifts for the day
              liftsForToday.forEach(liftName => {
                  const tm = trainingMaxes[liftName as keyof typeof trainingMaxes];
                  if (tm !== undefined && tm > 0) {
                      const setsDetails = cycleWeek.percentages.map((percent, setIdx) => {
                          const calculatedWeight = roundToNearest2_5(tm * percent);
                          const reps = cycleWeek.reps[setIdx];
                          const isAmrap = cycleWeek.amrapSetIndex === setIdx;

                          return {
                              setNumber: setIdx + 1,
                              percentage: percent,
                              calculatedWeight: calculatedWeight,
                              reps: reps,
                              isAmrap: isAmrap,
                          };
                      });

                      const exerciseObj = allExercises.find(ex => ex.name === liftName);

                       potentialDayExercises.push({
                           name: liftName,
                           category: "Exercice de powerlifting",
                           muscleGroup: exerciseObj?.muscleGroup || "Autre",
                           muscles: exerciseObj?.muscles || [],
                           equipment: exerciseObj?.equipment || [],
                           sets: cycleWeek.percentages.length.toString(),
                           reps: cycleWeek.reps.join('/'),
                           notes: `TM: ${tm} kg`,
                           setsDetails: setsDetails,
                       });

                       if (limitedDailyExerciseGroups.includes(exerciseObj?.muscleGroup as MuscleGroup)) {
                           muscleGroupDailyCount[exerciseObj!.muscleGroup] = (muscleGroupDailyCount[exerciseObj!.muscleGroup] || 0) + 1;
                       }
                  }
              });

              // --- Accessory Selection for 5/3/1 ---
              const addedAccessoryNames = new Set<string>();
              let exercisesAddedCount = potentialDayExercises.length;

              // Prioritize user-selected priority exercises first
              if (priorityExercises && priorityExercises.length > 0) {
                  const prioritized = shuffleArray(availableAccessoryExercises.filter(ex => priorityExercises.includes(ex.name)));
                  for (const ex of prioritized) {
                      if (canAddExercise(ex, exercisesAddedCount, addedAccessoryNames, muscleGroupDailyCount)) {
                          commitAddExercise(ex);
                      }
                  }
              }

              // Then add accessories based on priority muscles
              if (priorityMuscles && priorityMuscles.length > 0) {
                  const prioritizedByMuscle = shuffleArray(availableAccessoryExercises.filter(ex =>
                      priorityMuscles.includes(ex.muscleGroup) && !addedAccessoryNames.has(ex.name)
                  ));
                  for (const ex of prioritizedByMuscle) {
                      if (canAddExercise(ex, exercisesAddedCount, addedAccessoryNames, muscleGroupDailyCount)) {
                          commitAddExercise(ex);
                      }
                  }
              }

              // --- Strict Arm Isolation Balancing Logic ---
              const availableBicepsIsolation = shuffleArray(availableExercises.filter(ex => ex.muscleGroup === "Biceps" && (ex.category === "Isolation lourde" || ex.category === "Isolation légère")));
              const availableTricepsIsolation = shuffleArray(availableExercises.filter(ex => ex.muscleGroup === "Triceps" && (ex.category === "Isolation lourde" || ex.category === "Isolation légère")));

              let bicepPoolIdx = 0;
              let tricepPoolIdx = 0;

              // Add biceps and triceps in strict pairs
              while (exercisesAddedCount < maxExercisesPerDay && bicepPoolIdx < availableBicepsIsolation.length && tricepPoolIdx < availableTricepsIsolation.length) {
                  const nextBicep = availableBicepsIsolation[bicepPoolIdx];
                  const nextTricep = availableTricepsIsolation[tricepPoolIdx];

                  // Check if both can be added before committing either
                  const canAddBicep = canAddExercise(nextBicep, exercisesAddedCount, addedAccessoryNames, muscleGroupDailyCount);
                  const canAddTricep = canAddExercise(nextTricep, exercisesAddedCount + (canAddBicep ? 1 : 0), addedAccessoryNames, muscleGroupDailyCount); // Check tricep assuming bicep is added

                  if (canAddBicep && canAddTricep) {
                      commitAddExercise(nextBicep);
                      commitAddExercise(nextTricep);
                      bicepPoolIdx++;
                      tricepPoolIdx++;
                  } else {
                      // If a pair cannot be formed, stop trying to add arm isolation for this day
                      break;
                  }
              }

              // Fill remaining slots with other random accessories (excluding arms already handled)
              const remainingAccessories = shuffleArray(availableAccessoryExercises.filter(ex =>
                  !addedAccessoryNames.has(ex.name) && ex.muscleGroup !== "Biceps" && ex.muscleGroup !== "Triceps"
              ));
              for (const ex of remainingAccessories) {
                  if (canAddExercise(ex, exercisesAddedCount, addedAccessoryNames, muscleGroupDailyCount)) {
                      commitAddExercise(ex);
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
  const bigStrengthExercises = ["Squat barre", "Soulevé de terre", "Développé couché", "Développé militaire barre"];

  // Define muscle groups for each split type (using general MuscleGroup type)
  const splitMuscles: { [key: string]: MuscleGroup[][] } = {
      "Full Body (Tout le corps)": [["Jambes", "Pectoraux", "Dos", "Épaules", "Biceps", "Triceps", "Abdos", "Mollets", "Avant-bras"]], // All muscles each day
      "Half Body (Haut / Bas)": [["Pectoraux", "Dos", "Épaules", "Biceps", "Triceps"], ["Jambes", "Abdos", "Mollets", "Avant-bras"]], // Upper/Lower split
      "Push Pull Legs": [["Pectoraux", "Épaules", "Triceps"], ["Dos", "Biceps", "Avant-bras"], ["Jambes", "Abdos", "Mollets"]], // PPL split
  };

  // Use the determined split
  const selectedSplitMuscles = splitMuscles[determinedSplit] || splitMuscles["Full Body (Tout le corps)"]; // Fallback to Full Body
  const numSplitDays = selectedSplitMuscles.length;

  const weeklyVolumeCap = 15; // Max sets per week for large muscle groups (used as a soft cap in current logic)


  // Generate 4 weeks
  for (let weekNum = 1; weekNum <= 4; weekNum++) {
    const week: Program['weeks'][number] = {
      weekNumber: weekNum,
      days: [],
    };

    // Initialize weekly volume tracker for this week
    const weeklyVolume: { [key in MuscleGroup]?: number } = {};
    limitedDailyExerciseGroups.forEach(group => weeklyVolume[group] = 0);


    // Generate days based on joursEntrainement
    for (let dayIndex = 0; dayIndex < joursEntrainement; dayIndex++) {
      const day: Program['weeks'][number]['days'][number] = {
        dayNumber: dayIndex + 1,
        exercises: [],
      };

      // Track exercises per muscle group for the current day
      const muscleGroupDailyCount: { [key: string]: number } = {};

      // Determine which muscle groups to target based on the split and day index
      const targetMuscleGroups = selectedSplitMuscles[dayIndex % numSplitDays];

      let dayExercises: Exercise[] = [];
      const addedExerciseNames = new Set<string>();

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

           // Check daily limit for large muscle groups
           if (limitedDailyExerciseGroups.includes(exercise.muscleGroup)) {
               const currentCount = muscleGroupDailyCount[exercise.muscleGroup] || 0;
               if (currentCount >= 2) {
                   return false; // Cannot add more than 2 exercises for this large muscle group today
               }
               // If added, increment count
               muscleGroupDailyCount[exercise.muscleGroup] = currentCount + 1;
           }

           // Check volume cap only for large muscle groups (this is a soft cap, daily limit is stricter)
           if (limitedDailyExerciseGroups.includes(exercise.muscleGroup)) {
                if ((weeklyVolume[exercise.muscleGroup] || 0) + baseSets > weeklyVolumeCap) {
                    // This check is less critical now with the daily limit, but kept as a safeguard
                    // return false; // Cannot add due to cap
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


      // --- Add exercises based on category priority, priority muscles, and limits ---
      // Add powerlifting exercises first (up to 1-2 per day if available and targeted)
      shuffleArray(powerliftingExercises).slice(0, Math.min(powerliftingExercises.length, 2)).forEach(addSimpleExerciseIfPossible);

      // Add secondary compounds (up to 2-3 per day if available and targeted)
      shuffleArray(secondaryCompounds).slice(0, Math.min(secondaryCompounds.length, 3)).forEach(addSimpleExerciseIfPossible);

      // --- Strict Arm Isolation Balancing Logic (for non-5/3/1) ---
      const availableBicepsIsolation = shuffleArray(availableExercisesForToday.filter(ex => ex.muscleGroup === "Biceps" && (ex.category === "Isolation lourde" || ex.category === "Isolation légère")));
      const availableTricepsIsolation = shuffleArray(availableExercisesForToday.filter(ex => ex.muscleGroup === "Triceps" && (ex.category === "Isolation lourde" || ex.category === "Isolation légère")));

      let bicepPoolIdx = 0;
      let tricepPoolIdx = 0;

      // Add biceps and triceps in strict pairs
      while (exercisesAddedCount < maxExercisesPerDay && bicepPoolIdx < availableBicepsIsolation.length && tricepPoolIdx < availableTricepsIsolation.length) {
          const nextBicep = availableBicepsIsolation[bicepPoolIdx];
          const nextTricep = availableTricepsIsolation[tricepPoolIdx];

          // Check if both can be added before committing either
          const canAddBicep = addSimpleExerciseIfPossible(nextBicep);
          // Temporarily decrement exercisesAddedCount and muscleGroupDailyCount for bicep to check tricep correctly
          if (canAddBicep) {
              exercisesAddedCount--;
              if (limitedDailyExerciseGroups.includes(nextBicep.muscleGroup)) {
                  muscleGroupDailyCount[nextBicep.muscleGroup] = (muscleGroupDailyCount[nextBicep.muscleGroup] || 0) - 1;
              }
          }

          const canAddTricep = addSimpleExerciseIfPossible(nextTricep);

          // Revert temporary changes if bicep was added but tricep couldn't be
          if (canAddBicep && !canAddTricep) {
              // Remove the bicep exercise that was just added
              dayExercises.pop();
              addedExerciseNames.delete(nextBicep.name);
              exercisesAddedCount++; // Revert count
              if (limitedDailyExerciseGroups.includes(nextBicep.muscleGroup)) {
                  muscleGroupDailyCount[nextBicep.muscleGroup] = (muscleGroupDailyCount[nextBicep.muscleGroup] || 0) + 1;
              }
          }

          if (canAddBicep && canAddTricep) {
              // Both were added successfully, increment indices
              bicepPoolIdx++;
              tricepPoolIdx++;
          } else {
              // If a pair cannot be formed, stop trying to add arm isolation for this day
              // Also increment indices to move past the current exercises that couldn't be paired
              bicepPoolIdx++;
              tricepPoolIdx++;
              break;
          }
      }

      // Add remaining other isolation exercises (abs, calves, shoulders, etc.)
      const remainingAccessories = shuffleArray(availableAccessoryExercises.filter(ex =>
          !addedExerciseNames.has(ex.name) && ex.muscleGroup !== "Biceps" && ex.muscleGroup !== "Triceps"
      ));
      for (const ex of remainingAccessories) {
          if (addSimpleExerciseIfPossible(ex)) {
              // If added, continue to next
          }
      }


      // Ensure total exercises don't exceed maxExercisesPerDay (redundant with addSimpleExerciseIfPossible checks, but safe)
      const finalDayExercises = dayExercises.slice(0, exercisesAddedCount);


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