// import { useSelector } from "@/hooks/useSelector";
// import { useSend } from "@/hooks/useSend";
// import { useChat } from "ai/react";
// import { CommandLoading } from "cmdk";
// import { ChevronRightIcon, RefreshCcwIcon } from "lucide-react";
// import { useCallback, useContext, useEffect, useState } from "react";
// import { RecipeChatContext } from "./recipe-chat";
// import { Badge } from "./ui/badge";
// import { CommandGroup, CommandItem } from "./ui/command";
// import { Button } from "./ui/button";

// export default function RecipeSuggestions({}: {}) {
//   const actor = useContext(RecipeChatContext);
//   const chatId = useSelector(actor, (state) => state.context.chatId);
//   const send = useSend();

//   const { messages, isLoading } = useChat({
//     id: "suggestions",
//     api: `/api/chat/${chatId}/suggestions`,
//   });

//   const handlePressStartOver = useCallback(() => {
//     send({ type: "START_OVER" });
//   }, [send]);

//   const handleSelectItem = useCallback(
//     (name: string, description: string) => {
//       return () => {
//         send({ type: "SELECT_RECIPE", name, description });
//       };
//     },
//     [send]
//   );

//   const suggestions = messages[1]?.content;
//   const items = suggestions
//     ?.split("\n")
//     .filter((item) => item.split(":").length === 2)
//     .map((item) => item.split(":").map((f) => f.trim()));

//   return (
//     <>
//       {items?.length > 0 && (
//         <CommandGroup heading="Suggestions" className="max-h-50">
//           {items.map(([name, description]) => {
//             return (
//               <CommandItem
//                 key={name}
//                 onSelect={handleSelectItem(name, description)}
//               >
//                 <div className="flex flex-row flex-1 gap-2 items-center justify-between">
//                   <div className="flex flex-col gap-2">
//                     <h3 className="text-lg font-semibold text-slate-900">
//                       {name}
//                     </h3>
//                     <p className="text-mg text-slate-700">{description}</p>
//                   </div>
//                   <ChevronRightIcon />
//                 </div>
//               </CommandItem>
//             );
//             // return <CommandItem key={name}>{description}</CommandItem>;
//           })}
//         </CommandGroup>
//       )}
//       {isLoading ? (
//         <CommandLoading>
//           <div className="text-center">
//             <Badge variant={"outline"} className="p-3 m-3 font-semibold">
//               <AnimatedText />
//             </Badge>
//           </div>
//         </CommandLoading>
//       ) : (
//         items?.length > 0 && (
//           <div className="p-3 flex justify-center w-full flex-row">
//             <Button
//               variant="secondary"
//               onClick={handlePressStartOver}
//               className="text-slate-500 font-semibold flex flex-row gap-1"
//             >
//               <RefreshCcwIcon size={18} style={{ stroke: "currentColor" }} />

//               <span>Start Over</span>
//             </Button>
//           </div>
//         )
//       )}
//     </>
//   );
// }

// const AnimatedText = () => {
//   const [dots, setDots] = useState("");

//   useEffect(() => {
//     const interval = setInterval(() => {
//       setDots((prev) => (prev.length < 3 ? prev + "." : ""));
//     }, 500); // 500ms interval for changing dots

//     // Cleanup interval on component unmount
//     return () => clearInterval(interval);
//   }, []);

//   return <>🧪 Conjuring Recipes {dots}</>;
// };
