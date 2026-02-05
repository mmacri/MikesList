import { z } from "zod";
import { getAllCategorySlugs, tagSet } from "./config";

const categorySlugSet = new Set(getAllCategorySlugs());

const listingBaseObject = z.object({
  title: z.string().trim().min(3).max(90),
  categorySlug: z.string().refine((value) => categorySlugSet.has(value), {
    message: "Invalid category"
  }),
  locationType: z.enum(["city", "remote"]),
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
  tags: z
    .array(z.string())
    .default([])
    .refine((values) => values.every((value) => tagSet.has(value)), {
      message: "Invalid tag"
    }),
  priceAmount: z.number().int().nonnegative().optional().nullable(),
  priceUnit: z.string().trim().max(20).optional().nullable(),
  description: z.string().trim().min(10).max(4000)
});

const withCityValidation = <T extends z.ZodTypeAny>(schema: T) =>
  schema.superRefine((data, ctx) => {
    const payload = data as {
      locationType?: "city" | "remote";
      city?: string;
      state?: string;
    };

    if (payload.locationType === "city") {
      if (!payload.city || !payload.state) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "City and state are required for city listings"
        });
      }
    }
  });

export const listingBaseSchema = withCityValidation(listingBaseObject);

export const listingCreateSchema = withCityValidation(
  listingBaseObject.extend({
    posterEmail: z.string().trim().email()
  })
);

export const listingEditSchema = listingBaseSchema;

export const replySchema = z.object({
  yourEmail: z.string().trim().email(),
  message: z.string().trim().min(5).max(2000)
});

export const reportSchema = z.object({
  reason: z.enum([
    "spam",
    "scam",
    "harassment",
    "personal-info",
    "prohibited",
    "other"
  ]),
  details: z.string().trim().min(5).max(2000),
  reporterEmail: z.string().trim().email().optional().or(z.literal(""))
});

export const adminLoginSchema = z.object({
  password: z.string().min(6).max(200)
});
