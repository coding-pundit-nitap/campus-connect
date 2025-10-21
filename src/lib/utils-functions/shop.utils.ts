import { ButtonConfig, FormFieldConfig } from "@/types/ui.types";
import { ShopActionFormData, ShopFormData } from "@/validations";

class ShopUIServices {
  createShopLinkFormFields = (): FormFieldConfig<ShopFormData>[] => {
    return [
      {
        name: "name",
        label: "Shop Name",
        type: "text",
        placeholder: "Enter shop name",
        required: true,
      },
      {
        name: "description",
        label: "Description",
        type: "textarea",
        placeholder: "Enter shop description",
        required: true,
      },
      {
        name: "location",
        label: "Location",
        type: "text",
        placeholder: "Enter shop location",
        required: true,
      },
      {
        name: "opening",
        label: "Opening Hours",
        type: "text",
        placeholder: "Enter opening hours",
        required: true,
      },
      {
        name: "closing",
        label: "Closing Hours",
        type: "text",
        placeholder: "Enter closing hours",
        required: true,
      },
      {
        name: "imageKey",
        label: "Product Image",
        type: "file",
        accept: "image/*",
        maxSize: 1,
        required: false,
      },
    ];
  };

  createShopUpdateFormFields = (): FormFieldConfig<ShopActionFormData>[] => {
    return [
      {
        name: "name",
        label: "Shop Name",
        type: "text",
        placeholder: "Enter shop name",
        required: true,
      },
      {
        name: "description",
        label: "Description",
        type: "textarea",
        placeholder: "Enter shop description",
        required: true,
      },
      {
        name: "location",
        label: "Location",
        type: "text",
        placeholder: "Enter shop location",
        required: true,
      },
      {
        name: "opening",
        label: "Opening Hours",
        type: "text",
        placeholder: "Enter opening hours (e.g., 09:00)",
        required: true,
      },
      {
        name: "closing",
        label: "Closing Hours",
        type: "text",
        placeholder: "Enter closing hours (e.g., 17:00)",
        required: true,
      },
      {
        name: "image",
        label: "Shop Image",
        type: "file",
        accept: "image/*",
        maxSize: 5,
        required: false,
      },
    ];
  };

  createShopSubmitButton = (isLoading: boolean): ButtonConfig => {
    return {
      text: "Link Shop",
      type: "submit",
      variant: "default",
      loading: isLoading,
    };
  };

  getDefaultShopLinkCardConfig = () => {
    return {
      className: "mx-4 w-full md:w-1/2 lg:w-1/3",
      title: "Link Your Shop",
      description: "Please enter the shop details to get started.",
    };
  };

  formatShopLinkError = (error: Error | null): string | null => {
    if (!error) return null;
    if (error.message.includes("already exists")) {
      return "A shop with this name already exists.";
    }

    return "An unexpected error occurred. Please try again.";
  };
}

export const shopUIServices = new ShopUIServices();

export default shopUIServices;
