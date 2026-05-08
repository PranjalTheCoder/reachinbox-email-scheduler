"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { emailApi } from "@/services/api";
import type { ParseCSVResult } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Upload, Users, CheckCircle, FileText, Sparkles } from "lucide-react";

const schema = z.object({
  subject: z.string().min(1, "Subject is required").max(255),
  body: z.string().min(1, "Body is required"),
  startTime: z.string().min(1, "Start time is required"),
  delayBetweenEmailsMs: z.number().int().min(0).default(2000),
  hourlyLimit: z.number().int().min(1).max(1000).default(100),
});

type FormData = z.infer<typeof schema>;

export function ComposeForm() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [csvResult, setCsvResult] = useState<ParseCSVResult | null>(null);
  const [csvLoading, setCsvLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { delayBetweenEmailsMs: 2000, hourlyLimit: 100 },
  });

  const scheduleMutation = useMutation({
    mutationFn: emailApi.scheduleEmails,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["emails"] });
      toast.success(`${data.scheduled} emails scheduled successfully!`);
      reset();
      setCsvResult(null);
      if (fileRef.current) fileRef.current.value = "";
    },
    onError: (err: unknown) => {
      const msg =
        err instanceof Error ? err.message : "Failed to schedule emails";
      toast.error(msg);
    },
  });

  const handleFile = async (file: File) => {
    setCsvLoading(true);
    try {
      const result = await emailApi.parseCSV(file);
      setCsvResult(result);
      if (result.valid > 0)
        toast.success(`${result.valid} valid emails detected`);
      else toast.warning("No valid emails found in file");
    } catch {
      toast.error("Failed to parse file");
    } finally {
      setCsvLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const onSubmit = (data: FormData) => {
    if (!csvResult?.emails.length) {
      toast.error("Please upload a CSV with at least one valid email");
      return;
    }
    scheduleMutation.mutate({
      ...data,
      recipientEmails: csvResult.emails.map((e) => ({
        email: e.email,
        name: e.name,
      })),
    });
  };

  const defaultStartTime = new Date(Date.now() + 5 * 60 * 1000)
    .toISOString()
    .slice(0, 16);

  return (
    <div className="max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight">
            Compose Email Campaign
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Schedule a bulk email campaign with CSV recipients
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Email Content */}
          <div className="rounded-2xl border bg-card p-6 space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Sparkles className="h-4 w-4" /> Email Content
            </div>
            <Input
              placeholder="Enter email subject..."
              error={errors.subject?.message}
              {...register("subject")}
            />
            <Textarea
              placeholder="Write your email content here... (HTML supported)"
              rows={8}
              error={errors.body?.message}
              {...register("body")}
            />
          </div>

          {/* CSV Upload */}
          <div className="rounded-2xl border bg-card p-6 space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Upload className="h-4 w-4" /> Recipients
            </div>

            <div
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer ${
                dragOver
                  ? "border-primary bg-primary/5 scale-[1.01]"
                  : "border-border hover:border-primary/40 hover:bg-accent/50"
              }`}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <AnimatePresence mode="wait">
                {csvLoading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center"
                  >
                    <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Parsing file...
                    </p>
                  </motion.div>
                ) : csvResult && csvResult.valid > 0 ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center"
                  >
                    <CheckCircle className="h-10 w-10 text-emerald-500 mb-3" />
                    <p className="font-medium">
                      {csvResult.valid} valid emails detected
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {csvResult.total} total rows · {csvResult.invalid} invalid
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center"
                  >
                    <FileText className="h-10 w-10 text-muted-foreground/40 mb-3" />
                    <p className="text-sm font-medium">
                      Drop a CSV or TXT file here
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      One email per line, or comma-separated
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.txt,text/csv,text/plain"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {csvResult && csvResult.valid > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="flex items-start gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20"
              >
                <Users className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">{csvResult.valid} recipients</p>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    Emails will be staggered with the configured delay between
                    each send
                  </p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Scheduling */}
          <div className="rounded-2xl border bg-card p-6 space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Scheduling
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Start Time</label>
                <Input
                  type="datetime-local"
                  defaultValue={defaultStartTime}
                  {...register("startTime")}
                />
                {errors.startTime?.message && (
                  <p className="text-xs text-red-500">
                    {errors.startTime.message as string}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">
                  Delay Between Emails (ms)
                </label>
                <Input
                  type="number"
                  min={0}
                  step={500}
                  {...register("delayBetweenEmailsMs", { valueAsNumber: true })}
                />
                {errors.delayBetweenEmailsMs?.message && (
                  <p className="text-xs text-red-500">
                    {errors.delayBetweenEmailsMs.message as string}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Hourly Limit</label>
                <Input
                  type="number"
                  min={1}
                  max={1000}
                  {...register("hourlyLimit", { valueAsNumber: true })}
                />
                {errors.hourlyLimit?.message && (
                  <p className="text-xs text-red-500">
                    {errors.hourlyLimit.message as string}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-muted-foreground">
              {csvResult?.valid
                ? `${csvResult.valid} emails will be scheduled`
                : "Upload a CSV to continue"}
            </p>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  reset();
                  setCsvResult(null);
                }}
              >
                Reset
              </Button>
              <Button
                type="submit"
                loading={scheduleMutation.isPending}
                disabled={!csvResult?.valid}
              >
                Schedule{" "}
                {csvResult?.valid ? `${csvResult.valid} Emails` : "Emails"}
              </Button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
