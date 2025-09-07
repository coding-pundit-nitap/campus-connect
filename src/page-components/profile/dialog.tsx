import React from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const Dialog = () => {
  return (
    <AlertDialog>
      <AlertDialogTrigger>Edit changes</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <Card>
            <CardHeader className="p-4">
              <CardTitle>Change Your Credentials here : </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div>
                <label className="p-1" htmlFor="Name">
                  Name :{" "}
                </label>{" "}
                <br />
                <input
                  type="text"
                  name="Name"
                  placeholder="Enter your New name"
                  className="p-1"
                />
              </div>
              <div>
                <label className="p-1" htmlFor="Name">
                  Email :
                </label>{" "}
                <br />
                <input
                  className="p-1"
                  type="text"
                  name="Name"
                  placeholder="New your new Email"
                />
              </div>
              <div>
                <label className="p-1" htmlFor="Name">
                  Address :
                </label>{" "}
                <br />
                <input
                  className="p-1"
                  type="text"
                  name="Name"
                  placeholder="Enter your New Adderss"
                />
              </div>
            </CardContent>
          </Card>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction>Save Changes</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default Dialog;
