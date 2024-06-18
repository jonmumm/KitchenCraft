import { Slot } from "@radix-ui/react-slot";
import React, { useState } from "react";
import { twc } from "react-twc";
import "tailwindcss/tailwind.css";
import { Input } from "./input";

interface EditableProps {
  editing: boolean;
  children: React.ReactNode;
}

interface EditableDivProps {
  children: React.ReactNode;
}

interface EditableInputProps {
  children: React.ReactNode;
}

export const EditableContent: React.FC<EditableDivProps> = ({ children }) => {
  return <Slot>{children}</Slot>;
};

export const EditableInput = twc(Input)``;

// export const EditableInput: React.FC<EditableInputProps> = ({ children }) => {
//   return <Slot>{children}</Slot>;
// };

export const Editable: React.FC<EditableProps> = ({ editing, children }) => {
  const [isEditing, setIsEditing] = useState(editing);

  return (
    <>
      {React.Children.map(children, (child) => {
        if (
          isEditing &&
          React.isValidElement(child) &&
          child.type === EditableInput
        ) {
          return <EditableInput>{child.props.children}</EditableInput>;
        } else if (
          !isEditing &&
          React.isValidElement(child) &&
          child.type === EditableContent
        ) {
          return <EditableContent>{child.props.children}</EditableContent>;
        }
        return null;
      })}
    </>
  );
};
