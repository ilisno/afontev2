import React, { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate, Link } from 'react-router-dom'; // Import Link

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription as CardDescriptionShadcn } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { showSuccess, showError } from '@/utils/toast';
import { supabase } from '@/integrations/supabase/client';
import { usePopup } from '@/contexts/PopupContext';
import { generateProgramClientSide, Program, ProgramFormData } from '@/utils/programGenerator';
import { useSession } from '@supabase/auth-helpers-react'; // Import useSession
import { useIsMobile } from '@/hooks/use-mobile'; // Import useIsMobile
import { cn } from '@/lib/utils'; // Import cn

// Define the schema for form validation
const formSchema = z.object({
  objectif: z.enum(["Prise de Masse", "Sèche / Perte de Gras", "Powerlifting", "Powerbuilding"], {
    required_error: "Veuillez sélectionner un objectif principal.",
  }),
  experience: z.enum(["Débutant (< 1 an)", "Intermédiaire (1-3 ans)", "Avancé (3+ ans)"], {
    required_error: "Veuillez sélectionner votre niveau d'expérience.",
  }),
  split: z.enum(["Full Body (Tout le corps)", "Half Body (Haut / Bas)", "Push Pull Legs", "Autre / Pas de préférence"], {
    required_error: "Veuillez sélectionner un type de split.",
  }),
  joursEntrainement: z.coerce.number({
    required_error: "Veuillez indiquer le nombre de jours d'entraînement.",
    invalid_type_error: "Veuillez entrer un nombre valide.",
  }).min(1, { message: "Doit être au moins 1." }).max(7, { message: "Doit être au maximum 7." }),
  dureeMax: z.coerce.number({
    required_error: "Veuillez indiquer la durée maximale par séance.",
    invalid_type_error: "Veuillez entrer un nombre valide.",
  }).min(15, { message: "Doit être au moins 15 minutes." }).max(180, { message: "Doit être au maximum 180 minutes." }),
  materiel: z.array(z.string()).optional(),
  email: z.string().email({
    message: "Veuillez entrer une adresse email valide.",
  }).or(z.literal("")), // Allow empty string or a valid email

  // New fields for 1RM (optional by default)
  squat1RM: z.coerce.number().optional().nullable(),
  bench1RM: z.coerce.number().optional().nullable(),
  deadlift1RM: z.coerce.number().optional().nullable(),
  ohp1RM: z.coerce.number().optional().nullable(),
  // New field for priority muscle groups
  priorityMuscles: z.array(z.string()).optional(),
  // New field for priority exercises
  priorityExercises: z.array(z.string()).optional(),
}).superRefine((data, ctx) => {
    // Custom validation: If objective is Powerlifting or Powerbuilding, 1RM fields are required and > 0
    if (data.objectif === "Powerlifting" || data.objectif === "Powerbuilding") {
        if (!data.squat1RM || data.squat1RM <= 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Veuillez entrer votre 1RM au Squat (doit être > 0).",
                path: ['squat1RM'],
            });
        }
        if (!data.bench1RM || data.bench1RM <= 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Veuillez entrer votre 1RM au Développé Couché (doit être > 0).",
                path: ['bench1RM'],
            });
        }
        if (!data.deadlift1RM || data.deadlift1RM <= 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Veuillez entrer votre 1RM au Soulevé de Terre (doit être > 0).",
                path: ['deadlift1RM'],
            });
        }
        if (!data.ohp1RM || data.ohp1RM <= 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Veuillez entrer votre 1RM à l'Overhead Press (doit être > 0).",
                path: ['ohp1RM'],
            });
        }
    }
});


const ProgrammeGenerator: React.FC = () => {
  const [generatedProgram, setGeneratedProgram] = useState<Program | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<z.infer<typeof formSchema> | null>(null);

  const { showRandomPopup } = usePopup();
  const navigate = useNavigate();
  const session = useSession(); // Get the user session
  const isMobile = useIsMobile(); // Use the hook

  // Initialize the form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      objectif: undefined,
      experience: undefined,
      split: undefined,
      joursEntrainement: 3,
      dureeMax: 60,
      materiel: [],
      email: session?.user?.email || "", // Pre-fill email if logged in
      squat1RM: null, // Initialize new fields
      bench1RM: null,
      deadlift1RM: null,
      ohp1RM: null,
      priorityMuscles: [], // Initialize new field
      priorityExercises: [], // Initialize new field
    },
  });

  // Watch the 'objectif' field to conditionally show 1RM inputs
  const selectedObjectif = form.watch("objectif");
  const show1RMInputs = selectedObjectif === "Powerlifting" || selectedObjectif === "Powerbuilding";


  // Update default email value if session changes after initial render
  React.useEffect(() => {
    if (session?.user?.email) {
      form.setValue("email", session.user.email);
    } else {
       // Optionally clear email if user logs out while on the page
       form.setValue("email", "");
    }
  }, [session, form]);


  const materielOptions = [
    { id: "barre-halteres", label: "Barre & Haltères" },
    { id: "machines-guidees", label: "Machines Guidées" },
    { id: "poids-corps", label: "Poids du Corps (dips tractions)" },
  ];

  // Define muscle group options for priority selection (Removed Lombaires)
  const muscleGroupOptions = [
      { id: "Jambes", label: "Jambes" },
      { id: "Pectoraux", label: "Pectoraux" },
      { id: "Dos", label: "Dos" },
      { id: "Épaules", label: "Épaules" },
      { id: "Biceps", label: "Biceps" },
      { id: "Triceps", label: "Triceps" },
      { id: "Abdos", label: "Abdos" },
      { id: "Mollets", label: "Mollets" },
      { id: "Avant-bras", label: "Avant-bras" },
      // Removed Lombaires
  ];

  // Define priority exercise options
  const priorityExerciseOptions = [
      { id: "Squat barre", label: "Squat barre" },
      { id: "Développé couché", label: "Développé couché" },
      { id: "Soulevé de terre", label: "Soulevé de terre" },
      { id: "Développé militaire barre", label: "Développé militaire barre" },
      { id: "Tractions", label: "Tractions" },
      { id: "Dips", label: "Dips" },
  ];


  // Function to handle the actual program generation and Supabase insertion
  async function generateAndSaveProgram(values: z.infer<typeof formSchema>) {
     setIsSubmitting(true);
     console.log("Generating and saving program for values:", values);

     try {
       // --- Call the client-side generator ---
       const program = generateProgramClientSide(values as ProgramFormData);
       setGeneratedProgram(program);
       console.log("Program generated:", program);

       // --- Insert form data into program_logs table (always log generation attempt) ---
       // This insertion will now trigger the SQL FUNCTION to add email to email_subscribers
       const { data: logData, error: logError } = await supabase
         .from('program_logs') // *** Changed table name ***
         .insert([
           {
             form_data: values,
             user_email: values.email || null, // Save email if provided
             user_id: session?.user?.id || null, // Save user ID if logged in
             program_title: program.title,
             program_description: program.description,
           },
         ]);

       if (logError) {
         console.error("Error inserting data into program_logs:", logError);
         // Don't necessarily show an error toast for this background log
       } else {
         console.log("Program log data inserted successfully:", logData);
       }

       // --- Insert full program into training_programs table IF user is logged in ---
       let trainingProgramId = null;
       if (session?.user?.id) {
           console.log("User is logged in, saving full program to training_programs...");
           const { data: trainingProgramData, error: trainingProgramError } = await supabase
               .from('training_programs')
               .insert([
                   {
                       user_id: session.user.id,
                       program: program, // Save the full program JSON
                       duration_weeks: program.weeks.length, // Assuming 4 weeks for now
                       days_per_week: values.joursEntrainement,
                       program_name: program.title, // Use the generated title as default name
                   },
               ])
               .select('id') // Select the ID of the newly inserted row
               .single(); // Expect a single row

           if (trainingProgramError) {
               console.error("Error inserting data into training_programs:", trainingProgramError);
               showError("Une erreur est survenue lors de l'enregistrement de votre programme.");
           } else if (trainingProgramData) {
               console.log("Training program saved successfully:", trainingProgramData);
               trainingProgramId = trainingProgramData.id;
               showSuccess("Votre programme a été généré et enregistré dans votre espace !");
           } else {
               console.error("Training program insert returned no data.");
               showError("Une erreur est survenue lors de l'enregistrement de votre programme.");
           }
       } else {
           // If not logged in, just show success for generation
           showSuccess("Votre programme a été généré ! Connectez-vous pour l'enregistrer.");
       }


     } catch (error) {
       console.error("An unexpected error occurred during generation or saving:", error);
       showError("Une erreur inattendue est survenue.");
     } finally {
       setIsSubmitting(false);
     }
  }


  // Handle form submission - show popup first
  async function onSubmit(values: z.infer<typeof formSchema>) {
    console.log("Form submitted, showing random popup...");
    setFormData(values); // Store form data temporarily

    // Define a callback function that calls generateAndSaveProgram after the popup is closed
    const handlePopupCloseAndGenerate = () => {
        console.log("Popup closed, proceeding with program generation...");
        if (formData) { // Use the stored formData
            generateAndSaveProgram(formData);
            setFormData(null); // Clear stored data after use
        }
    };

    // Show a random popup. When it's closed, the callback will run.
    showRandomPopup({ onCloseCallback: handlePopupCloseAndGenerate });

    // The rest of the onSubmit function is handled by the callback.
  }


  // Render the program if generated, otherwise render the form
  if (generatedProgram) {
    // Check if user is NOT logged in
    const isNotLoggedIn = !session;

    return (
      <div className="flex flex-col min-h-screen bg-gray-100">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-12 flex flex-col items-center"> {/* Added flex-col items-center */}
          {/* Message for non-logged-in users */}
          {isNotLoggedIn && (
             <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-8 w-full max-w-2xl" role="alert"> {/* Added w-full max-w-2xl */}
               <p className="font-bold">Programme généré !</p>
               <p>
                 Pour accéder au programme complet, suivre vos performances semaine après semaine et l'enregistrer dans votre espace personnel, vous devez être abonné.
                 {/* Updated button style */}
                 <Link to="/tarifs" className="inline-block ml-4 px-4 py-2 bg-sbf-red text-white hover:bg-red-700 rounded-md font-semibold transition-colors duration-200">
                   Voir les tarifs
                 </Link>
               </p>
             </div>
          )}

          <Card className="w-full max-w-2xl shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-gray-800">{generatedProgram.title}</CardTitle>
              <CardDescriptionShadcn className="text-gray-600">{generatedProgram.description}</CardDescriptionShadcn>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {generatedProgram.weeks.map((week) => (
                  <AccordionItem value={`week-${week.weekNumber}`} key={week.weekNumber}>
                    <AccordionTrigger className="text-lg font-semibold text-gray-800 px-4">Semaine {week.weekNumber}</AccordionTrigger> {/* Added px-4 */}
                    <AccordionContent className="py-4 px-4"> {/* Added px-4 */}
                      <div className="space-y-6"> {/* Increased spacing */}
                        {week.days.map((day) => (
                          // Adjusted styling for the day container
                          <div key={day.dayNumber} className="border rounded-md bg-gray-50 w-full p-4"> {/* Added p-4 */}
                            <h4 className="text-lg font-bold mb-4 text-gray-800">Jour {day.dayNumber}</h4> {/* Increased font size */}

                            {/* Map over exercises within this day */}
                            {day.exercises.map((exercise, exerciseIndex) => {
                               // Determine number of sets based on program type
                               const numberOfSets = generatedProgram.is531 && exercise.setsDetails
                                  ? exercise.setsDetails.length
                                  : parseInt(exercise.sets, 10) || 0;

                               const setsArray = Array.from({ length: numberOfSets }, (_, i) => i);

                               return (
                                  // Container for a single exercise
                                  <div key={exerciseIndex} className="mb-6 last:mb-0"> {/* Added margin-bottom */}
                                     <p className="font-semibold text-gray-800 mb-2">{exercise.name}</p> {/* Exercise name */}
                                     {/* Display muscles worked */}
                                     {exercise.muscles && exercise.muscles.length > 0 && (
                                        <p className="text-sm text-gray-600 italic mb-2">Muscles: {exercise.muscles.join(', ')}</p>
                                     )}
                                     {/* Display program notes */}
                                     {exercise.notes && <p className="text-sm text-gray-500 italic mb-2">Notes: {exercise.notes}</p>}

                                     {/* Table or list for sets */}
                                     <Table className="mt-2"> {/* Added margin-top */}
                                       <TableHeader>
                                         <TableRow>
                                           <TableHead className="text-center">Série</TableHead>
                                           <TableHead className="text-center">Répétitions</TableHead>
                                           <TableHead className="text-center">Poids (kg)</TableHead>
                                         </TableRow>
                                       </TableHeader>
                                       <TableBody>
                                         {/* Render sets based on is531 flag */}
                                         {generatedProgram.is531 && exercise.setsDetails ? (
                                           exercise.setsDetails.map((set, setIndex) => (
                                             <TableRow key={setIndex}>
                                               <TableCell className="text-center">{set.setNumber}</TableCell>
                                               <TableCell className={cn("text-center", set.isAmrap && 'font-bold text-sbf-red')}>
                                                  <span className={cn(isNotLoggedIn && 'blur-sm')}>
                                                     {set.reps} {set.isAmrap && '(AMRAP)'}
                                                  </span>
                                               </TableCell>
                                               <TableCell className="text-center">
                                                  <span className={cn(isNotLoggedIn && 'blur-sm')}>
                                                     {set.calculatedWeight} kg ({Math.round(set.percentage * 100)}%)
                                                  </span>
                                               </TableCell>
                                             </TableRow>
                                           ))
                                         ) : (
                                           setsArray.map((setIndex) => (
                                             <TableRow key={setIndex}>
                                               <TableCell className="text-center">{setIndex + 1}</TableCell>
                                               <TableCell className="text-center">
                                                  <span className={cn(isNotLoggedIn && 'blur-sm')}>{exercise.sets}</span> {/* Use exercise.sets for total sets */}
                                               </TableCell>
                                               <TableCell className="text-center">
                                                  <span className={cn(isNotLoggedIn && 'blur-sm')}>{exercise.reps}</span> {/* Use exercise.reps for rep range */}
                                               </TableCell>
                                               <TableCell className="text-center">
                                                  <span className={cn(isNotLoggedIn && 'blur-sm')}>-- kg</span> {/* Placeholder */}
                                               </TableCell>
                                             </TableRow>
                                           ))
                                         )}
                                       </TableBody>
                                     </Table>
                                  </div>
                               );
                            })}
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  // Render the form if no program is generated yet
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-12 flex justify-center">
        <Card className="w-full max-w-2xl shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-800">Générer un programme personnalisé</CardTitle>
            <CardDescriptionShadcn className="text-gray-600">Remplissez le formulaire pour obtenir votre plan d'entraînement sur mesure.</CardDescriptionShadcn>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Objectif Principal */}
                <FormField
                  control={form.control}
                  name="objectif"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-lg font-semibold text-gray-800">Objectif principal</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="Prise de Masse" />
                            </FormControl>
                            <FormLabel className="font-normal text-gray-700">
                              Prise de Masse 💪
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="Sèche / Perte de Gras" />
                            </FormControl>
                            <FormLabel className="font-normal text-gray-700">
                              Sèche / Perte de Gras 🔥
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="Powerlifting" />
                            </FormControl>
                            <FormLabel className="font-normal text-gray-700">
                              Powerlifting 🏋️
                            </FormLabel>
                          </FormItem>
                           <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="Powerbuilding" />
                            </FormControl>
                            <FormLabel className="font-normal text-gray-700">
                              Powerbuilding ✨
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 1RM Inputs (Conditionally rendered) */}
                {show1RMInputs && (
                    <div className="space-y-4 border-t pt-6 mt-6"> {/* Added border and padding */}
                        <h3 className="text-xl font-bold text-gray-800">Vos 1RM (Max sur 1 répétition)</h3>
                        <p className="text-gray-600 text-sm">Entrez vos meilleures performances récentes pour les 4 mouvements principaux.</p>
                        <FormField
                            control={form.control}
                            name="squat1RM"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Squat (kg)</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="Ex: 100" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="bench1RM"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Développé Couché (kg)</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="Ex: 80" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="deadlift1RM"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Soulevé de Terre (kg)</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="Ex: 150" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="ohp1RM"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Overhead Press (kg)</FormLabel>
                                    <FormControl>
                                        {/* Corrected onChange handler */}
                                        <Input type="number" placeholder="Ex: 50" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                )}


                {/* Niveau d'expérience */}
                <FormField
                  control={form.control}
                  name="experience"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-lg font-semibold text-gray-800">Niveau d'expérience</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="Débutant (< 1 an)" />
                            </FormControl>
                            <FormLabel className="font-normal text-gray-700">
                              Débutant (&lt; 1 an)
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="Intermédiaire (1-3 ans)" />
                            </FormControl>
                            <FormLabel className="font-normal text-gray-700">
                              Intermédiaire (1-3 ans)
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="Avancé (3+ ans)" />
                            </FormControl>
                            <FormLabel className="font-normal text-gray-700">
                              Avancé (3+ ans)
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Type de split préféré */}
                <FormField
                  control={form.control}
                  name="split"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-lg font-semibold text-gray-800">Type de split préféré</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="Full Body (Tout le corps)" />
                            </FormControl>
                            <FormLabel className="font-normal text-gray-700">
                              Full Body (Tout le corps)
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="Half Body (Haut / Bas)" />
                            </FormControl>
                            <FormLabel className="font-normal text-gray-700">
                              Half Body (Haut / Bas)
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="Push Pull Legs" />
                            </FormControl>
                            <FormLabel className="font-normal text-gray-700">
                              Push Pull Legs
                            </FormLabel>
                          </FormItem>
                           <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="Autre / Pas de préférence" />
                            </FormControl>
                            <FormLabel className="font-normal text-gray-700">
                              Autre / Pas de préférence
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Jours d'entraînement / semaine */}
                <FormField
                  control={form.control}
                  name="joursEntrainement"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-semibold text-gray-800">Jours d'entraînement / semaine</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="3" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Durée max par séance (minutes) */}
                <FormField
                  control={form.control}
                  name="dureeMax"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-semibold text-gray-800">Durée max par séance (minutes)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="60" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Matériel disponible */}
                <FormField
                  control={form.control}
                  name="materiel"
                  render={() => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel className="text-lg font-semibold text-gray-800">Matériel disponible</FormLabel>
                        <FormDescription className="text-gray-600">
                          Cochez tout ce que vous avez à disposition.
                        </FormDescription>
                      </div>
                      {materielOptions.map((item) => (
                        <FormField
                          key={item.id}
                          control={form.control}
                          name="materiel"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={item.id}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(item.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, item.id])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== item.id
                                            )
                                          );
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal text-gray-700">
                                  {item.label}
                                </FormLabel>
                              </FormItem>
                            );
                          }}
                        />
                      ))}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Parties du corps prioritaires */}
                 <FormField
                   control={form.control}
                   name="priorityMuscles"
                   render={() => (
                     <FormItem>
                       <div className="mb-4">
                         <FormLabel className="text-lg font-semibold text-gray-800">Parties du corps à développer en priorité</FormLabel>
                         <FormDescription className="text-gray-600">
                           Sélectionnez les groupes musculaires sur lesquels vous souhaitez mettre l'accent.
                         </FormDescription>
                       </div>
                       {muscleGroupOptions.map((item) => (
                         <FormField
                           key={item.id}
                           control={form.control}
                           name="priorityMuscles"
                           render={({ field }) => {
                             return (
                               <FormItem
                                 key={item.id}
                                 className="flex flex-row items-start space-x-3 space-y-0"
                               >
                                 <FormControl>
                                   <Checkbox
                                     checked={field.value?.includes(item.id)}
                                     onCheckedChange={(checked) => {
                                       return checked
                                         ? field.onChange([...field.value, item.id])
                                         : field.onChange(
                                             field.value?.filter(
                                               (value) => value !== item.id
                                             )
                                           );
                                     }}
                                   />
                                 </FormControl>
                                 <FormLabel className="font-normal text-gray-700">
                                   {item.label}
                                 </FormLabel>
                               </FormItem>
                             );
                           }}
                         />
                       ))}
                       <FormMessage />
                     </FormItem>
                   )}
                 />

                 {/* Exercices prioritaires */}
                 <FormField
                   control={form.control}
                   name="priorityExercises"
                   render={() => (
                     <FormItem>
                       <div className="mb-4">
                         <FormLabel className="text-lg font-semibold text-gray-800">Exercices prioritaires</FormLabel>
                         <FormDescription className="text-gray-600">
                           Sélectionnez les exercices sur lesquels vous souhaitez particulièrement progresser en force.
                         </FormDescription>
                       </div>
                       {priorityExerciseOptions.map((item) => (
                         <FormField
                           key={item.id}
                           control={form.control}
                           name="priorityExercises"
                           render={({ field }) => {
                             return (
                               <FormItem
                                 key={item.id}
                                 className="flex flex-row items-start space-x-3 space-y-0"
                               >
                                 <FormControl>
                                   <Checkbox
                                     checked={field.value?.includes(item.id)}
                                     onCheckedChange={(checked) => {
                                       return checked
                                         ? field.onChange([...field.value, item.id])
                                         : field.onChange(
                                             field.value?.filter(
                                               (value) => value !== item.id
                                             )
                                           );
                                     }}
                                   />
                                 </FormControl>
                                 <FormLabel className="font-normal text-gray-700">
                                   {item.label}
                                 </FormLabel>
                               </FormItem>
                             );
                           }}
                         />
                       ))}
                       <FormMessage />
                     </FormItem>
                   )}
                 />


                {/* Votre email */}
                 <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-semibold text-gray-800">Votre email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="vous@email.com" {...field} />
                      </FormControl>
                       <FormDescription className="text-gray-600">
                          Entrez votre email pour enregistrer votre programme et le retrouver plus tard. Pas de spam, promis :)
                        </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Submit Button */}
                <Button type="submit" className="w-full bg-sbf-red text-white hover:bg-red-700 text-lg py-6" disabled={isSubmitting}>
                  {isSubmitting ? 'Génération en cours...' : 'Générer mon programme'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default ProgrammeGenerator;