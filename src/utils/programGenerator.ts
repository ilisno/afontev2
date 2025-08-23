import * as z from "zod";

// Define the schema for form validation (needed for the generator function)
const programFormSchemaForGenerator = z.object({
  objectif: z.enum(["Prise de Masse", "Sèche / Perte de Gras", "Powerlifting", "Powerbuilding"]),
  experience: z.enum(["Débutant (< 1 an)", "Intermédiaire (1-3 ans)", "Avancé (3+ ans)"]),
  joursEntrainement: z.coerce.number().min(1).max(6),
  dureeMax: z.coerce.number().min(15).max(180),
  materiel: z.array(z.string()).optional(),
  squat1RM: z.coerce.number().optional().nullable(),
  bench1RM: z.coerce.number().optional().nullable(),
  deadlift1RM: z.coerce.number().optional().nullable(),
  ohp1RM: z.coerce.number().optional().nullable(),
  squatRmType: z.coerce.number().optional().nullable(),
  benchRmType: z.coerce.number().optional().nullable(),
  deadliftRmType: z.coerce.number().optional().nullable(),
  ohpRmType: z.coerce.number().optional().nullable(),
  priorityMuscles: z.array(z.string()).optional(),
  priorityExercises: z.array(z.string()).optional(),
  selectedMainLifts: z.array(z.string()).optional(),
}).superRefine((data, ctx) => {
    if (data.objectif === "Powerlifting" || data.objectif === "Powerbuilding") {
        const mainLiftsToCheck = [
            { field: "squat1RM", rmTypeField: "squatRmType", name: "Squat barre", label: "Squat" },
            { field: "bench1RM", rmTypeField: "benchRmType", name: "Développé couché", label: "Développé Couché" },
            { field: "deadlift1RM", rmTypeField: "deadliftRmType", name: "Soulevé de terre", label: "Soulevé de Terre" },
            { field: "ohp1RM", rmTypeField: "ohpRmType", name: "Développé militaire barre", label: "Overhead Press" },
        ];

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

export type ProgramFormData = z.infer<typeof programFormSchemaForGenerator>;

type ExerciseCategory = "Exercice de powerlifting" | "Compound secondaire" | "Isolation lourde" | "Isolation légère";
type MuscleGroup = "Jambes" | "Pectoraux" | "Dos" | "Épaules" | "Biceps" | "Triceps" | "Abdos" | "Mollets" | "Avant-bras";

interface Exercise {
  name: string;
  category: ExerciseCategory;
  muscleGroup: MuscleGroup;
  muscles: string[];
  equipment: string[];
}

type SetDetails = {
    setNumber: number;
    percentage: number;
    calculatedWeight: number;
    reps: string;
    isAmrap?: boolean;
}[];

type ExerciseInProgram = {
  name: string;
  sets: string;
  reps: string;
  notes?: string;
  muscles?: string[];
  setsDetails?: SetDetails;
};

type DayInProgram = {
  dayNumber: number;
  exercises: ExerciseInProgram[];
};

type WeekInProgram = {
  weekNumber: number;
  days: DayInProgram[];
};

export type Program = {
  title: string;
  description: string;
  is531?: boolean;
  weeks: WeekInProgram[];
};

const roundToNearest2_5 = (weight: number): number => {
    return Math.round(weight / 2.5) * 2.5;
};

const estimate1RM = (weight: number, reps: number): number => {
    if (reps === 0) return 0;
    if (reps === 1) return weight;
    return weight * (1 + reps / 30);
};

const allExercises: Exercise[] = [
  { name: "Squat barre", category: "Exercice de powerlifting", muscleGroup: "Jambes", muscles: ["quadriceps", "fessiers", "lombaires"], equipment: ["barre-halteres"] },
  { name: "Développé couché", category: "Exercice de powerlifting", muscleGroup: "Pectoraux", muscles: ["pectoraux", "triceps", "deltoïdes antérieurs"], equipment: ["barre-halteres"] },
  { name: "Soulevé de terre", category: "Exercice de powerlifting", muscleGroup: "Dos", muscles: ["ischios", "fessiers", "lombaires", "dorsaux", "trapèzes"], equipment: ["barre-halteres"] },
  { name: "Développé militaire barre", category: "Exercice de powerlifting", muscleGroup: "Épaules", muscles: ["épaules", "triceps"], equipment: ["barre-halteres"] },

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

  { name: "Leg extension", category: "Isolation lourde", muscleGroup: "Jambes", muscles: ["quadriceps"], equipment: ["machines-guidees"] },
  { name: "Leg curl", category: "Isolation lourde", muscleGroup: "Jambes", muscles: ["ischios"], equipment: ["machines-guidees"] },
  { name: "Curl biceps barre", category: "Isolation lourde", muscleGroup: "Biceps", muscles: ["biceps"], equipment: ["barre-halteres"] },
  { name: "Extension triceps poulie haute", category: "Isolation lourde", muscleGroup: "Triceps", muscles: ["triceps"], equipment: ["machines-guidees"] },
  { name: "Curl incliné haltères", category: "Isolation lourde", muscleGroup: "Biceps", muscles: ["biceps (longue portion)"], equipment: ["barre-halteres"] },
  { name: "Preacher curl", category: "Isolation lourde", muscleGroup: "Biceps", muscles: ["biceps (courte portion)"], equipment: ["barre-halteres", "machines-guidees"] },
  { name: "Reverse curls", category: "Isolation lourde", muscleGroup: "Biceps", muscles: ["brachial", "avant-bras"], equipment: ["barre-halteres"] },

  { name: "Élévations latérales haltères", category: "Isolation légère", muscleGroup: "Épaules", muscles: ["deltoïdes moyens"], equipment: ["barre-halteres"] },
  { name: "Crunchs", category: "Isolation légère", muscleGroup: "Abdos", muscles: ["abdominaux"], equipment: [] },
  { name: "Leg raises", category: "Isolation légère", muscleGroup: "Abdos", muscles: ["abdominaux inférieurs", "fléchisseurs de hanches"], equipment: [] },
  { name: "Calf raises", category: "Isolation légère", muscleGroup: "Jambes", muscles: ["mollets"], equipment: [] },
  { name: "Face pulls", category: "Isolation légère", muscleGroup: "Dos", muscles: ["deltoïdes postérieurs", "trapèzes", "rotateurs externes"], equipment: ["machines-guidees"] },
  { name: "Pushdowns à la corde", category: "Isolation légère", muscleGroup: "Triceps", muscles: ["triceps"], equipment: ["machines-guidees"] },
  { name: "Élévations latérales à la poulie basse", category: "Isolation légère", muscleGroup: "Épaules", muscles: ["deltoïdes moyens"], equipment: ["machines-guidees"] },
];


const filterByEquipment = (exercises: Exercise[], availableEquipment?: string[]): Exercise[] => {
    if (!availableEquipment || availableEquipment.length === 0) {
        return exercises.filter(ex => ex.equipment.length === 0);
    }
    return exercises.filter(ex =>
        ex.equipment.length === 0 || ex.equipment.some(eq => availableEquipment.includes(eq))
    );
};

const filterByMuscleGroups = (exercises: Exercise[], targetMuscleGroups: MuscleGroup[]): Exercise[] => {
    if (!targetMuscleGroups || targetMuscleGroups.length === 0) {
        return exercises;
    }
    return exercises.filter(ex => targetMuscleGroups.includes(ex.muscleGroup));
};

const categoryPriority: { [key in ExerciseCategory]: number } = {
    "Exercice de powerlifting": 1,
    "Compound secondaire": 2,
    "Isolation lourde": 3,
    "Isolation légère": 4,
};

const shuffleArray = <T>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

// Helper function to determine RPE note based on category and week number
const getRpeNote = (category: ExerciseCategory, weekNum: number, objectif: ProgramFormData['objectif']): string => {
    if (category === "Isolation légère") {
        return "RPE 10"; // Push to failure
    } else if (category === "Isolation lourde") {
        const rpeMap: { [key: number]: number | string } = { 1: 8, 2: 8.5, 3: 9, 4: 10 };
        return `RPE ${rpeMap[weekNum] || 8}`;
    } else if (category === "Compound secondaire") {
        const rpeMap: { [key: number]: number | string } = { 1: 7, 2: 7.5, 3: 8, 4: 9 };
        return `RPE ${rpeMap[weekNum] || 7}`;
    } else if (category === "Exercice de powerlifting") {
        const rpeMap: { [key: number]: number } = { 1: 6, 2: 7, 3: 8, 4: 10 };
        return `RPE ${rpeMap[weekNum] || 6}`;
    }
    return "";
};


export const generateProgramClientSide = (values: ProgramFormData): Program => {
  const { objectif, experience, joursEntrainement, materiel, dureeMax, squat1RM, bench1RM, deadlift1RM, ohp1RM, squatRmType, benchRmType, deadliftRmType, ohpRmType, priorityMuscles, priorityExercises, selectedMainLifts } = values;

  let determinedSplit: "Full Body (Tout le corps)" | "Half Body (Haut / Bas)" | "Push Pull Legs";
  let selectedSplitMuscles: MuscleGroup[][];

  const FullBodyMuscles: MuscleGroup[] = ["Jambes", "Pectoraux", "Dos", "Épaules", "Biceps", "Triceps", "Abdos", "Mollets", "Avant-bras"];
  const UpperMuscles: MuscleGroup[] = ["Pectoraux", "Dos", "Épaules", "Biceps", "Triceps"];
  const LowerMuscles: MuscleGroup[] = ["Jambes", "Abdos", "Mollets", "Avant-bras"];
  const PushMuscles: MuscleGroup[] = ["Pectoraux", "Épaules", "Triceps"];
  const PullMuscles: MuscleGroup[] = ["Dos", "Biceps", "Avant-bras"];
  const LegsMuscles: MuscleGroup[] = ["Jambes", "Abdos", "Mollets"];


  if (joursEntrainement >= 1 && joursEntrainement <= 3) {
      determinedSplit = "Full Body (Tout le corps)";
      selectedSplitMuscles = [FullBodyMuscles];
  } else if (joursEntrainement === 4) {
      determinedSplit = "Half Body (Haut / Bas)";
      selectedSplitMuscles = [UpperMuscles, LowerMuscles, UpperMuscles, LowerMuscles];
  } else if (joursEntrainement === 5) {
      determinedSplit = "Push Pull Legs";
      selectedSplitMuscles = [PushMuscles, PullMuscles, LegsMuscles, PushMuscles, LegsMuscles];
  } else if (joursEntrainement === 6) {
      determinedSplit = "Push Pull Legs";
      selectedSplitMuscles = [PushMuscles, PullMuscles, LegsMuscles, PushMuscles, PullMuscles, LegsMuscles];
  } else {
      determinedSplit = "Full Body (Tout le corps)";
      selectedSplitMuscles = [FullBodyMuscles];
  }


  const availableExercises = filterByEquipment(allExercises, materiel);

  const maxExercisesPerDay = 8; // Max exercises to aim for
  const limitedDailyExerciseGroups: MuscleGroup[] = ["Jambes", "Pectoraux", "Dos"];

  const program: Program = {
      title: "",
      description: "",
      is531: false,
      weeks: [],
  };


  if (objectif === "Powerlifting" || objectif === "Powerbuilding") {
      program.title = `Programme ${objectif} - ${joursEntrainement} jours/semaine`;
      program.description = `Programme personnalisé pour votre objectif de ${objectif} sur ${joursEntrainement} jours/semaine.`;
      program.is531 = true;

      const trainingMaxes = {
          "Squat barre": (squat1RM && squatRmType) ? roundToNearest2_5(estimate1RM(squat1RM, squatRmType) * 0.9) : 0,
          "Développé couché": (bench1RM && benchRmType) ? roundToNearest2_5(estimate1RM(bench1RM, benchRmType) * 0.9) : 0,
          "Soulevé de terre": (deadlift1RM && deadliftRmType) ? roundToNearest2_5(estimate1RM(deadlift1RM, deadliftRmType) * 0.9) : 0,
          "Développé militaire barre": (ohp1RM && ohpRmType) ? roundToNearest2_5(estimate1RM(ohp1RM, ohpRmType) * 0.9) : 0,
      };

      const cycleWeeks = [
          { week: 1, percentages: [0.65, 0.75, 0.85], reps: ["5", "5", "5+"], amrapSetIndex: 2 },
          { week: 2, percentages: [0.70, 0.80, 0.90], reps: ["3", "3", "3+"], amrapSetIndex: 2 },
          { week: 3, percentages: [0.75, 0.85, 0.95], reps: ["5", "3", "1+"], amrapSetIndex: 2 },
          { week: 4, percentages: [0.40, 0.50, 0.60], reps: ["5", "5", "5"], amrapSetIndex: null },
      ];

      const allPossibleMainLifts = ["Squat barre", "Développé couché", "Soulevé de terre", "Développé militaire barre"];
      const mainLiftsForCycle = selectedMainLifts && selectedMainLifts.length > 0
          ? allPossibleMainLifts.filter(lift => selectedMainLifts.includes(lift))
          : [];

      const dailyLiftsMap: { [dayIndex: number]: string[] } = {};
      for (let i = 0; i < joursEntrainement; i++) {
          dailyLiftsMap[i] = [];
      }

      mainLiftsForCycle.forEach((lift, index) => {
          const dayToAssign = index % joursEntrainement;
          dailyLiftsMap[dayToAssign].push(lift);
      });


      for (const cycleWeek of cycleWeeks) {
          const week: WeekInProgram = {
              weekNumber: cycleWeek.week,
              days: [],
          };

          for (let dayIndex = 0; dayIndex < joursEntrainement; dayIndex++) {
              const day: DayInProgram = {
                  dayNumber: dayIndex + 1,
                  exercises: [],
              };

              const targetMuscleGroups = selectedSplitMuscles[dayIndex % selectedSplitMuscles.length];

              const liftsForToday = dailyLiftsMap[dayIndex] || [];
              const potentialDayExercises: ExerciseInProgram[] = [];
              const muscleGroupDailyCount: { [key: string]: number } = {};

              const canAddExercise = (
                  exercise: Exercise,
                  currentExercisesCount: number,
                  currentAddedNames: Set<string>,
                  currentMuscleGroupCounts: { [key: string]: number },
                  dayTargetMuscleGroups: MuscleGroup[]
              ): boolean => {
                  if (currentExercisesCount >= maxExercisesPerDay || currentAddedNames.has(exercise.name)) {
                      return false;
                  }
                  if (!dayTargetMuscleGroups.includes(exercise.muscleGroup)) {
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

              const commitAddExercise = (exercise: Exercise, sets?: string, reps?: string, notes?: string, setsDetails?: SetDetails) => {
                  potentialDayExercises.push({
                      name: exercise.name,
                      sets: sets || "3",
                      reps: reps || "8-12",
                      notes: notes || `RPE ${cycleWeek.week === 4 ? 8 : 9}`,
                      muscles: exercise.muscles,
                      setsDetails: setsDetails,
                  });
                  addedAccessoryNames.add(exercise.name);
                  exercisesAddedCount++;
                  if (limitedDailyExerciseGroups.includes(exercise.muscleGroup)) {
                      muscleGroupDailyCount[exercise.muscleGroup] = (muscleGroupDailyCount[exercise.muscleGroup] || 0) + 1;
                  }
              };

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

                       commitAddExercise(
                           exerciseObj!,
                           cycleWeek.percentages.length.toString(),
                           cycleWeek.reps.join('/'),
                           `TM: ${tm} kg`,
                           setsDetails
                       );
                  }
              });

              const addedAccessoryNames = new Set<string>();
              let exercisesAddedCount = potentialDayExercises.length;

              const availableAccessoryExercisesForToday = availableExercises.filter(ex =>
                  (ex.category === "Compound secondaire" || ex.category === "Isolation lourde" || ex.category === "Isolation légère") &&
                  targetMuscleGroups.includes(ex.muscleGroup)
              );

              if (priorityExercises && priorityExercises.length > 0) {
                  const prioritized = shuffleArray(availableAccessoryExercisesForToday.filter(ex => priorityExercises.includes(ex.name)));
                  for (const ex of prioritized) {
                      if (canAddExercise(ex, exercisesAddedCount, addedAccessoryNames, muscleGroupDailyCount, targetMuscleGroups)) {
                          commitAddExercise(ex);
                      }
                  }
              }

              if (priorityMuscles && priorityMuscles.length > 0) {
                  const prioritizedByMuscle = shuffleArray(availableAccessoryExercisesForToday.filter(ex =>
                      priorityMuscles.includes(ex.muscleGroup) && !addedAccessoryNames.has(ex.name)
                  ));
                  for (const ex of prioritizedByMuscle) {
                      if (canAddExercise(ex, exercisesAddedCount, addedAccessoryNames, muscleGroupDailyCount, targetMuscleGroups)) {
                          commitAddExercise(ex);
                      }
                  }
              }

              const availableBicepsIsolationForToday = shuffleArray(availableAccessoryExercisesForToday.filter(ex => ex.muscleGroup === "Biceps"));
              const availableTricepsIsolationForToday = shuffleArray(availableAccessoryExercisesForToday.filter(ex => ex.muscleGroup === "Triceps"));

              let bicepPoolIdx = 0;
              let tricepPoolIdx = 0;

              while (exercisesAddedCount < maxExercisesPerDay && bicepPoolIdx < availableBicepsIsolationForToday.length && tricepPoolIdx < availableTricepsIsolationForToday.length) {
                  const nextBicep = availableBicepsIsolationForToday[bicepPoolIdx];
                  const nextTricep = availableTricepsIsolationForToday[tricepPoolIdx];

                  const canAddBicep = canAddExercise(nextBicep, exercisesAddedCount, addedAccessoryNames, muscleGroupDailyCount, targetMuscleGroups);
                  const canAddTricep = canAddExercise(nextTricep, exercisesAddedCount + (canAddBicep ? 1 : 0), addedAccessoryNames, muscleGroupDailyCount, targetMuscleGroups);

                  if (canAddBicep && canAddTricep) {
                      commitAddExercise(nextBicep);
                      commitAddExercise(nextTricep);
                      bicepPoolIdx++;
                      tricepPoolIdx++;
                  } else {
                      break;
                  }
              }

              const remainingAccessoriesForToday = shuffleArray(availableAccessoryExercisesForToday.filter(ex =>
                  !addedAccessoryNames.has(ex.name) && ex.muscleGroup !== "Biceps" && ex.muscleGroup !== "Triceps"
              ));
              for (const ex of remainingAccessoriesForToday) {
                  if (canAddExercise(ex, exercisesAddedCount, addedAccessoryNames, muscleGroupDailyCount, targetMuscleGroups)) {
                      commitAddExercise(ex);
                  }
              }

              day.exercises = potentialDayExercises.slice(0, maxExercisesPerDay).map(ex => {
                 if (program.is531 && ex.setsDetails) {
                     return {
                         name: ex.name,
                         sets: ex.sets,
                         reps: ex.reps,
                         notes: ex.notes,
                         muscles: ex.muscles,
                         setsDetails: ex.setsDetails,
                     };
                 }

                let rpeNote = "";
                if (ex.category === "Isolation légère") {
                   rpeNote = "RPE 10";
                } else if (ex.category === "Isolation lourde") {
                   const rpeMap: { [key: number]: number | string } = { 1: 8, 2: 8.5, 3: 9, 4: 10 };
                   rpeNote = `RPE ${rpeMap[cycleWeek.week] || 8}`;
                } else if (ex.category === "Compound secondaire") {
                   const rpeMap: { [key: number]: number | string } = { 1: 7, 2: 7.5, 3: 8, 4: 9 };
                   rpeNote = `RPE ${rpeMap[cycleWeek.week] || 7}`;
                } else if (ex.category === "Exercice de powerlifting") {
                   const rpeMap: { [key: number]: number } = { 1: 6, 2: 7, 3: 8, 4: 10 };
                   rpeNote = `RPE ${rpeMap[cycleWeek.week] || 6}`;
                }

                return {
                  name: ex.name,
                  sets: "3",
                  reps: objectif === "Sèche / Perte de Gras" ? "12-15" : "8-12",
                  notes: rpeNote,
                  muscles: ex.muscles,
                };
              });


              day.exercises.sort((a, b) => {
                  const exerciseA = allExercises.find(ex => ex.name === a.name);
                  const exerciseB = allExercises.find(ex => ex.name === b.name);

                  const priorityA = exerciseA ? categoryPriority[exerciseA.category] : 99;
                  const priorityB = exerciseB ? categoryPriority[exerciseB.category] : 99;

                  return priorityA - priorityB;
              });


              week.days.push(day);
          }
          program.weeks.push(week);
      }

      return program;
  }

  program.title = `Programme ${objectif} - ${joursEntrainement} jours/semaine`;
  program.description = `Programme personnalisé pour votre objectif de ${objectif}.`;


  const baseReps = objectif === "Sèche / Perte de Gras" ? "12-15" : "8-12";
  const timePerCompoundSet = 5; // minutes
  const timePerIsolationSet = 3; // minutes

  // Determine sets per exercise based on duration
  const setsPerExercise = (dureeMax <= 60) ? 2 : 3;


  const numSplitDays = selectedSplitMuscles.length;

  const weeklyVolumeCap = 15; // This cap might need adjustment or removal if time-based allocation is primary


  for (let weekNum = 1; weekNum <= 4; weekNum++) {
    const week: WeekInProgram = {
      weekNumber: weekNum,
      days: [],
    };

    const weeklyVolume: { [key in MuscleGroup]?: number } = {};
    limitedDailyExerciseGroups.forEach(group => weeklyVolume[group] = 0);


    for (let dayIndex = 0; dayIndex < joursEntrainement; dayIndex++) {
      const day: DayInProgram = {
        dayNumber: dayIndex + 1,
        exercises: [],
      };

      let currentTimeSpent = 0; // Track time spent for the current day
      const muscleGroupDailyCount: { [key: string]: number } = {};

      const targetMuscleGroups = selectedSplitMuscles[dayIndex % numSplitDays];

      const addedExerciseNames = new Set<string>();

      const getEstimatedExerciseTime = (exercise: Exercise, sets: number): number => {
          const timePerSet = (exercise.category === "Exercice de powerlifting" || exercise.category === "Compound secondaire")
              ? timePerCompoundSet
              : timePerIsolationSet;
          return sets * timePerSet;
      };

      const canAddExercise = (exercise: Exercise): boolean => {
        const estimatedTime = getEstimatedExerciseTime(exercise, setsPerExercise);

        if (day.exercises.length >= maxExercisesPerDay || addedExerciseNames.has(exercise.name) || (currentTimeSpent + estimatedTime > dureeMax)) {
          return false;
        }
        if (!targetMuscleGroups.includes(exercise.muscleGroup)) {
          return false;
        }
        const isAvailable = exercise.equipment.length === 0 || (materiel && materiel.some(eq => exercise.equipment.includes(eq)));
        if (!isAvailable) {
            return false;
        }
        if (limitedDailyExerciseGroups.includes(exercise.muscleGroup)) {
          const currentCount = muscleGroupDailyCount[exercise.muscleGroup] || 0;
          if (currentCount >= 2) {
            return false;
          }
        }
        // The weekly volume cap might become less relevant with time-based allocation,
        // but keeping it as a secondary constraint for now.
        if (limitedDailyExerciseGroups.includes(exercise.muscleGroup)) {
            if ((weeklyVolume[exercise.muscleGroup] || 0) + setsPerExercise > weeklyVolumeCap) {
                return false;
            }
        }
        return true;
      };

      const addExerciseToDay = (exercise: Exercise) => {
        day.exercises.push({
          name: exercise.name,
          sets: setsPerExercise.toString(),
          reps: baseReps,
          notes: getRpeNote(exercise.category, weekNum, objectif),
          muscles: exercise.muscles,
        });
        addedExerciseNames.add(exercise.name);
        currentTimeSpent += getEstimatedExerciseTime(exercise, setsPerExercise);
        if (limitedDailyExerciseGroups.includes(exercise.muscleGroup)) {
          muscleGroupDailyCount[exercise.muscleGroup] = (muscleGroupDailyCount[exercise.muscleGroup] || 0) + 1;
          weeklyVolume[exercise.muscleGroup] = (weeklyVolume[exercise.muscleGroup] || 0) + setsPerExercise;
        }
      };

      const daySpecificExercises = availableExercises.filter(ex => targetMuscleGroups.includes(ex.muscleGroup));

      // Helper to try and add a specific exercise from a pool
      const tryAddSpecificExercise = (
          exerciseName: string,
          pool: Exercise[],
          canAdd: (ex: Exercise) => boolean,
          add: (ex: Exercise) => void
      ): boolean => {
          const exercise = pool.find(ex => ex.name === exerciseName);
          if (exercise && canAdd(exercise)) {
              add(exercise);
              return true;
          }
          return false;
      };

      // Create mutable pools for the current day, filtered by equipment and target muscle groups
      let powerliftingPool = shuffleArray(daySpecificExercises.filter(ex => ex.category === "Exercice de powerlifting"));
      let compoundSecondaryPool = shuffleArray(daySpecificExercises.filter(ex => ex.category === "Compound secondaire"));
      let isolationHeavyPool = shuffleArray(daySpecificExercises.filter(ex => ex.category === "Isolation lourde"));
      let isolationLightPool = shuffleArray(daySpecificExercises.filter(ex => ex.category === "Isolation légère"));


      // --- NEW: Specific Legs Day Logic ---
      if (targetMuscleGroups.includes("Jambes")) {
          // Prioritize Squat barre
          tryAddSpecificExercise("Squat barre", powerliftingPool, canAddExercise, addExerciseToDay);

          // Prioritize Hamstring Isolation (Leg curl first, then Soulevé de terre roumain)
          let hamstringAdded = false;
          if (!hamstringAdded) {
              hamstringAdded = tryAddSpecificExercise("Leg curl", isolationHeavyPool, canAddExercise, addExerciseToDay);
          }
          if (!hamstringAdded) {
              hamstringAdded = tryAddSpecificExercise("Soulevé de terre roumain", compoundSecondaryPool, canAddExercise, addExerciseToDay);
          }

          // If time permits, add Calf raises
          tryAddSpecificExercise("Calf raises", isolationLightPool, canAddExercise, addExerciseToDay);

          // If time permits, add Lunges (Fentes haltères first, then Split squat bulgare)
          let lungesAdded = false;
          if (!lungesAdded) {
              lungesAdded = tryAddSpecificExercise("Fentes haltères", compoundSecondaryPool, canAddExercise, addExerciseToDay);
          }
          if (!lungesAdded) {
              lungesAdded = tryAddSpecificExercise("Split squat bulgare", compoundSecondaryPool, canAddExercise, addExerciseToDay);
          }
      }
      // --- END NEW: Specific Legs Day Logic ---


      // 1. Add selected main lifts (if not already added by Legs logic)
      if (selectedMainLifts && selectedMainLifts.length > 0) {
          const mainLiftsForToday = shuffleArray(daySpecificExercises.filter(ex => selectedMainLifts.includes(ex.name) && !addedExerciseNames.has(ex.name)));
          for (const ex of mainLiftsForToday) {
              if (canAddExercise(ex)) {
                  addExerciseToDay(ex);
              }
          }
      }

      // 2. Add 1-2 primary compound lifts (powerlifting or heavy secondary)
      let compoundsAdded = 0;
      const maxCompounds = 2;

      for (const ex of powerliftingPool.filter(ex => !addedExerciseNames.has(ex.name))) { // Filter out already added
          if (compoundsAdded >= maxCompounds) break;
          if (canAddExercise(ex)) {
              addExerciseToDay(ex);
              compoundsAdded++;
          }
      }
      for (const ex of compoundSecondaryPool.filter(ex => !addedExerciseNames.has(ex.name))) { // Filter out already added
          if (compoundsAdded >= maxCompounds) break;
          if (canAddExercise(ex)) {
              addExerciseToDay(ex);
              compoundsAdded++;
          }
      }

      // 3. Add user-prioritized exercises
      if (priorityExercises && priorityExercises.length > 0) {
          const prioritized = shuffleArray(daySpecificExercises.filter(ex => priorityExercises.includes(ex.name) && !addedExerciseNames.has(ex.name)));
          for (const ex of prioritized) {
              if (canAddExercise(ex)) {
                  addExerciseToDay(ex);
              }
          }
      }

      // 4. Add exercises for user-prioritized muscle groups
      if (priorityMuscles && priorityMuscles.length > 0) {
          const prioritizedByMuscle = shuffleArray(daySpecificExercises.filter(ex =>
              priorityMuscles.includes(ex.muscleGroup) && !addedExerciseNames.has(ex.name)
          ));
          for (const ex of prioritizedByMuscle) {
              if (canAddExercise(ex)) {
                  addExerciseToDay(ex);
              }
          }
      }

      // 5. Balance Arm Isolation (Biceps/Triceps) if applicable to the day's split
      const hasUpperBodyMuscles = targetMuscleGroups.some(mg => ["Pectoraux", "Dos", "Épaules", "Biceps", "Triceps"].includes(mg));
      if (hasUpperBodyMuscles) {
          let bicepsAdded = 0;
          let tricepsAdded = 0;
          const maxArmIsolation = 1; // Aim for one bicep and one tricep exercise

          const availableBiceps = isolationHeavyPool.filter(e => e.muscleGroup === "Biceps" && !addedExerciseNames.has(e.name))
                                  .concat(isolationLightPool.filter(e => e.muscleGroup === "Biceps" && !addedExerciseNames.has(e.name)));
          const availableTriceps = isolationHeavyPool.filter(e => e.muscleGroup === "Triceps" && !addedExerciseNames.has(e.name))
                                   .concat(isolationLightPool.filter(e => e.muscleGroup === "Triceps" && !addedExerciseNames.has(e.name)));

          const shuffledBiceps = shuffleArray(availableBiceps);
          const shuffledTriceps = shuffleArray(availableTriceps);

          // Try to add one bicep exercise
          for (const ex of shuffledBiceps) {
              if (bicepsAdded >= maxArmIsolation) break;
              if (canAddExercise(ex)) {
                  addExerciseToDay(ex);
                  bicepsAdded++;
              }
          }
          // Try to add one tricep exercise
          for (const ex of shuffledTriceps) {
              if (tricepsAdded >= maxArmIsolation) break;
              if (canAddExercise(ex)) {
                  addExerciseToDay(ex);
                  tricepsAdded++;
              }
          }
      }

      // 6. Fill remaining slots with other isolation exercises or secondary compounds
      const remainingExercisesPool = shuffleArray(daySpecificExercises.filter(ex => !addedExerciseNames.has(ex.name)));
      for (const ex of remainingExercisesPool) {
          if (day.exercises.length >= maxExercisesPerDay) break; // Check max exercises again
          if (canAddExercise(ex)) {
              addExerciseToDay(ex);
          }
      }

      // Sort exercises by category priority
      day.exercises.sort((a, b) => {
          const exerciseA = allExercises.find(ex => ex.name === a.name);
          const exerciseB = allExercises.find(ex => ex.name === b.name);
          const priorityA = exerciseA ? categoryPriority[exerciseA.category] : 99;
          const priorityB = exerciseB ? categoryPriority[exerciseB.category] : 99;
          return priorityA - priorityB;
      });

      week.days.push(day);
    }
    program.weeks.push(week);
  }

  return program;
};