import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function(props : any){
  return (
     <Card className="m-1 sm:m-2 md:m-4 lg:m-6 xl:m-8 [box-shadow:rgba(50,50,93,0.25)_0px_2px_5px_-1px,rgba(0,0,0,0.3)_0px_1px_3px_-1px] w-[25%] overflow-hidden">
    <div>
      <img className="h-full w-full object-contain rounded-t-xl" src={`${props.image}`} alt="img" />
    </div>
  <CardHeader>
    <CardTitle className="text-xl">{props.itemName}</CardTitle>
    <CardDescription>{props.itemDescription}</CardDescription>
    <CardAction>⭐️ {props.ratings}</CardAction>
  </CardHeader>
  <CardContent>
    <p className="font-semibold"> {props.address}</p>
  </CardContent>
  <CardFooter>
    <p className="font-semibold"> {props.openingHours}</p>
  </CardFooter>
    <CardFooter>
    <p className="font-semibold"> {props.distance}</p>
  </CardFooter>
</Card>
  )
}