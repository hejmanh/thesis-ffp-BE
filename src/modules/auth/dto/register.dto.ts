import { z } from "zod";

export const RegisterDto = z.object({
    email: z.email("Invalid email address").toLowerCase(),
    password: z.string().min(8, "Password must be at least 8 characters")
                        .max(100, "Password must be at most 100 characters")
                        .regex(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/, "Password must contain at least 1 letter, 1 number and 1 special character"),
    name: z.string().min(1, "Name is required").max(100, "Name must be at most 100 characters").trim(),
    birthYear: z.number().int().min(1900, "Invalid birth year").max(new Date().getFullYear(), "Invalid birth year"),
    countryId: z.number().int().positive(),
    sexTypeId: z.number().int().positive(),
});

export type RegisterDto = z.infer<typeof RegisterDto>;