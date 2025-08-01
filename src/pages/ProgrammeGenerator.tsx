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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // Import Select components


const ProgrammeGenerator: React.FC = () => {
  const [generatedProgram, setGeneratedProgram] = useState<Program | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<z.infer<typeof formSchema> | null>(null);

  const { showRandomPopup } = usePopup();
  const navigate = useNavigate();
  const session = useSession(); // Get the user session
  const isMobile = useIsMobile(); // Use the hook

  // Define the schema for form validation dynamically based on session
  const formSchema = React.useMemo(() => z.object({
    objectif: z.enum(["Prise de Masse", "Sèche / Perte de Gras", "Powerlifting", "Powerbuilding"], {
      required_error: "Veuillez sélectionner un objectif principal.",
    }),
    experience: z.enum(["Débutant (< 1 an)", "Intermédiaire (1-3 ans)", "Avancé (3+ ans)"], {
      required_error: "Veuillez sélectionner votre niveau d'expérience.",
    }),
    joursEntrainement: z.coerce.number({
      required_error: "Veuillez indiquer le nombre de jours d'entraînement.",
      invalid_type_error: "Veuillez entrer un nombre valide.",
    }).min(1, { message: "Doit être au moins 1." }).max(6, { message: "Doit être au maximum 6." }), // Updated max to 6
    dureeMax: z.coerce.number({
      required_error: "Veuillez indiquer la durée maximale par séance.",
      invalid_type_error: "Veuillez entrer un nombre valide.",
    }).min(30, { message: "Doit être au moins 30 minutes." }).max(105, { message: "Doit être au maximum 105 minutes (1h45)." }), // Updated min to 30 and max to 105
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
    email: session?.user?.email
      ? z.string().email({ message: "Veuillez entrer une adresse email valide." })
      : z.string().email({ message: "Veuillez entrer une adresse email valide." }).min(1, "L'email est requis pour enregistrer votre programme."),
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
                  if (data.selectedMainLifts?.includes(liftInfo.name)) {
                      const rmField = liftInfo.field as keyof typeof data;
                      const rmTypeField = liftInfo.rmTypeField as keyof typeof data;

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
  }), [session]); // Re-memoize if session changes


  // Initialize the form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      objectif: undefined,
      experience: undefined,
      // Removed 'split' from defaultValues
      joursEntrainement: 3,
      dureeMax: 60,
      materiel: [],
      email: session?.user?.email || "", // Pre-fill email if logged in
      squat1RM: null, // Initialize new fields
      bench1RM: null,
      deadlift1RM: null,
      ohp1RM: null,
      squatRmType: 1, // Default to 1RM
      benchRmType: 1,
      deadliftRmType: 1,
      ohpRmType: 1,
      priorityMuscles: [], // Initialize new field
      priorityExercises: [], // Initialize new field
      selectedMainLifts: [], // Initialize new field
    },
  });

  // Watch the 'objectif' field to conditionally show 1RM inputs
  const selectedObjectif = form.watch("objectif");
  const show1RMInputsSection = selectedObjectif === "Powerlifting" || selectedObjectif === "Powerbuilding";
  const selectedMainLifts = form.watch("selectedMainLifts") || []; // Watch selected main lifts


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

  // Options for Jours d'entraînement
  const joursEntrainementOptions = Array.from({ length: 6 }, (_, i) => i + 1); // 1 to 6 days

  // Options for Durée max par séance
  const dureeMaxOptions = [30, 45, 60, 75, 90, 105]; // 30 min to 1h45 min (105 min)
  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes === 0 ? `${hours}h` : `${hours}h${remainingMinutes.toString().padStart(2, '0')} min`;
  };

  // Options for main lifts selection
  const mainLiftsOptions = [
    { id: "Squat barre", label: "Squat barre" },
    { id: "Développé couché", label: "Développé couché" },
    { id: "Soulevé de terre", label: "Soulevé de terre" },
    { id: "Développé militaire barre", label: "Développé militaire barre" },
  ];

  // Options for RM type (1RM to 10RM)
  const rmTypeOptions = Array.from({ length: 10 }, (_, i) => i + 1);


  // Function to handle the actual program generation and Supabase insertion
  async function generateAndSaveProgram(values: z.infer<typeof formSchema>) {
     setIsSubmitting(true);
     console.log("Generating and saving program for values:", values);

     try {
       // --- Call the client-side generator ---
       const program = generateProgramClientSide(values as ProgramFormData);
       setGeneratedProgram(program);
       console.log("Program generated:", program);

       // --- START: Direct email insertion into subscriber tables (without onConflict) ---
       if (values.email) {
         console.log(`Attempting to insert email ${values.email} into email_subscribers and email_subscribers_2.`);
         
         // Insert into email_subscribers
         const { error: subError1 } = await supabase
           .from('email_subscribers')
           .insert({ email: values.email });

         if (subError1) {
           if (subError1.code === '23505') { // Unique constraint violation
             console.log("Email already exists in email_subscribers, doing nothing.");
           } else {
             console.error("Error inserting email into email_subscribers:", subError1);
           }
         } else {
           console.log("Email inserted successfully into email_subscribers.");
         }

         // Insert into email_subscribers_2
         const { error: subError2 } = await supabase
           .from('email_subscribers_2')
           .insert({ email: values.email });

         if (subError2) {
           if (subError2.code === '23505') { // Unique constraint violation
             console.log("Email already exists in email_subscribers_2, doing nothing.");
           } else {
             console.error("Error inserting email into email_subscribers_2:", subError2);
           }
         } else {
           console.log("Email inserted successfully into email_subscribers_2.");
         }
       }
       // --- END: Direct email insertion ---

       // --- Insert form data into program_logs table (always log generation attempt) ---
       const { data: logData, error: logError } = await supabase
         .from('program_logs')
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
    // Removed: Check if user is NOT logged in
    // const isNotLoggedIn = !session;

    return (
      <div className="flex flex-col min-h-screen bg-gray-100">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-12 flex flex-col items-center"> {/* Added flex-col items-center */}
          {/* Removed: Message for non-logged-in users */}
          {/* {isNotLoggedIn && (
             <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-8 w-full max-w-2xl" role="alert">
               <p className="font-bold">Programme généré !</p>
               <p>
                 Pour accéder au programme complet, suivre vos performances semaine après semaine et l'enregistrer dans votre espace personnel, vous devez être abonné.
                 <Link to="/tarifs" className="inline-block ml-4 px-4 py-2 bg-afonte-red text-white hover:bg-red-700 rounded-md font-semibold transition-colors duration-200">
                   Voir les tarifs
                 </Link>
               </p>
             </div>
          )} */}

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
                          <div key={day.dayNumber} className="border rounded-md bg-gray-50 w-full"> {/* Removed p-4, added w-full */}
                            <h4 className="text-lg font-bold mb-4 text-gray-800 px-4 pt-4">Jour {day.dayNumber}</h4> {/* Added px-4 pt-4 */}

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
                                               <TableCell className={cn("text-center", set.isAmrap && 'font-bold text-afonte-red')}>
                                                  {/* Removed: <span className={cn(isNotLoggedIn && 'blur-sm')}> */}
                                                     {set.reps} {set.isAmrap && '(AMRAP)'}
                                                  {/* Removed: </span> */}
                                               </TableCell>
                                               <TableCell className="text-center">
                                                  {/* Removed: <span className={cn(isNotLoggedIn && 'blur-sm')}> */}
                                                     {set.calculatedWeight} kg ({Math.round(set.percentage * 100)}%)
                                                  {/* Removed: </span> */}
                                               </TableCell>
                                             </TableRow>
                                           ))
                                         ) : (
                                           setsArray.map((setIndex) => (
                                             <TableRow key={setIndex}>
                                               <TableCell className="text-center">{setIndex + 1}</TableCell>
                                               <TableCell className="text-center">
                                                  {/* Removed: <span className={cn(isNotLoggedIn && 'blur-sm')}>{exercise.sets}</span> */}
                                                  {exercise.sets}
                                               </TableCell>
                                               <TableCell className="text-center">
                                                  {/* Removed: <span className={cn(isNotLoggedIn && 'blur-sm')}>-- kg</span> */}
                                                  {exercise.reps}
                                               </TableCell>
                                               <TableCell className="text-center">
                                                  -- kg
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

                {/* Main Lifts Selection (Conditionally rendered) */}
                {show1RMInputsSection && (
                    <FormField
                        control={form.control}
                        name="selectedMainLifts"
                        render={() => (
                            <FormItem>
                                <div className="mb-4">
                                    <FormLabel className="text-lg font-semibold text-gray-800">Exercices principaux à inclure</FormLabel>
                                    <FormDescription className="text-gray-600">
                                        Sélectionnez les exercices de force que vous souhaitez faire.
                                    </FormDescription>
                                </div>
                                {mainLiftsOptions.map((item) => (
                                    <FormField
                                        key={item.id}
                                        control={form.control}
                                        name="selectedMainLifts"
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
                                                                    ? field.onChange([...(field.value || []), item.id])
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
                )}

                {/* 1RM Inputs (Conditionally rendered) */}
                {show1RMInputsSection && (selectedMainLifts.length > 0) && (
                    <div className="space-y-4 border-t pt-6 mt-6"> {/* Added border and padding */}
                        <h3 className="text-xl font-bold text-gray-800">Vos performances maximales</h3>
                        <p className="text-gray-600 text-sm">Entrez le poids et le nombre de répétitions maximales que vous pouvez faire pour les mouvements sélectionnés.</p>
                        {selectedMainLifts.includes("Squat barre") && (
                            <div className="flex items-end space-x-2">
                                <FormField
                                    control={form.control}
                                    name="squat1RM"
                                    render={({ field }) => (
                                        <FormItem className="flex-grow">
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
                                    name="squatRmType"
                                    render={({ field }) => (
                                        <FormItem className="w-24">
                                            <FormLabel>RM</FormLabel>
                                            <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="RM" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {rmTypeOptions.map((rm) => (
                                                        <SelectItem key={rm} value={rm.toString()}>
                                                            {rm}RM
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )}
                        {selectedMainLifts.includes("Développé couché") && (
                            <div className="flex items-end space-x-2">
                                <FormField
                                    control={form.control}
                                    name="bench1RM"
                                    render={({ field }) => (
                                        <FormItem className="flex-grow">
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
                                    name="benchRmType"
                                    render={({ field }) => (
                                        <FormItem className="w-24">
                                            <FormLabel>RM</FormLabel>
                                            <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="RM" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {rmTypeOptions.map((rm) => (
                                                        <SelectItem key={rm} value={rm.toString()}>
                                                            {rm}RM
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )}
                        {selectedMainLifts.includes("Soulevé de terre") && (
                            <div className="flex items-end space-x-2">
                                <FormField
                                    control={form.control}
                                    name="deadlift1RM"
                                    render={({ field }) => (
                                        <FormItem className="flex-grow">
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
                                    name="deadliftRmType"
                                    render={({ field }) => (
                                        <FormItem className="w-24">
                                            <FormLabel>RM</FormLabel>
                                            <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="RM" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {rmTypeOptions.map((rm) => (
                                                        <SelectItem key={rm} value={rm.toString()}>
                                                            {rm}RM
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )}
                        {selectedMainLifts.includes("Développé militaire barre") && (
                            <div className="flex items-end space-x-2">
                                <FormField
                                    control={form.control}
                                    name="ohp1RM"
                                    render={({ field }) => (
                                        <FormItem className="flex-grow">
                                            <FormLabel>Overhead Press (kg)</FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder="Ex: 50" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="ohpRmType"
                                    render={({ field }) => (
                                        <FormItem className="w-24">
                                            <FormLabel>RM</FormLabel>
                                            <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="RM" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {rmTypeOptions.map((rm) => (
                                                        <SelectItem key={rm} value={rm.toString()}>
                                                            {rm}RM
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )}
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

                {/* Removed: Type de split préféré */}

                {/* Jours d'entraînement / semaine (Select) */}
                <FormField
                  control={form.control}
                  name="joursEntrainement"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-semibold text-gray-800">Jours d'entraînement / semaine</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez le nombre de jours" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {joursEntrainementOptions.map((day) => (
                            <SelectItem key={day} value={day.toString()}>
                              {day} jour{day > 1 ? 's' : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Durée max par séance (minutes) (Select) */}
                <FormField
                  control={form.control}
                  name="dureeMax"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-semibold text-gray-800">Durée max par séance</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez la durée maximale" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {dureeMaxOptions.map((duration) => (
                            <SelectItem key={duration} value={duration.toString()}>
                              {formatDuration(duration)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                        <Input
                          type="email"
                          placeholder="vous@email.com"
                          {...field}
                          readOnly={!!session} // Make readOnly if session exists
                          className={cn(!!session && "bg-gray-100 cursor-not-allowed")} // Add styling for readOnly
                        />
                      </FormControl>
                       <FormDescription className="text-gray-600">
                          {session ? "Votre email de compte. Il sera utilisé pour enregistrer votre programme." : "Entrez votre email pour enregistrer votre programme et le retrouver plus tard. Pas de spam, promis :)"}
                        </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Submit Button */}
                <Button type="submit" className="w-full bg-afonte-red text-white hover:bg-red-700 text-lg py-6" disabled={isSubmitting}>
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