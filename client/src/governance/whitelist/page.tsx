import { useState } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Check } from "lucide-react";
import { useNavigate } from "react-router";
import { API_BASE_URL } from "@/config";

export default function WhiteListGovernancePage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    address: "",
    projectName: "",
    details: "",
  });

  // TODO: Easily managable with TanStack Query
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // TODO: Use `zod` or `yup` alogn with react-hook-form for managable validations
  const validateForm = () => {
    // Simple validation of required fields
    if (!formData.address.trim()) {
      setError("Governance address is required");
      return false;
    }
    if (!formData.projectName.trim()) {
      setError("Project name is required");
      return false;
    }
    if (!formData.details.trim()) {
      setError("Project details are required");
      return false;
    }
    
    // Simple Sui address validation (0x followed by 64 hex chars)
    const addressRegex = /^0x[a-fA-F0-9]{64}$/;
    if (!addressRegex.test(formData.address)) {
      setError("Invalid Sui address format. It should start with 0x followed by 64 hexadecimal characters.");
      return false;
    }

    return true;
  };

  // TODO: Whole logic can be moved to TanStack mutations
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/whitelist-governance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `Error: ${response.status} ${response.statusText}`
        );
      }

      // Success!
      setSuccess(true);
      
      // Reset form
      setFormData({
        address: "",
        projectName: "",
        details: "",
      });
      
      // Redirect after 2 seconds
      setTimeout(() => {
        navigate("/governance");
      }, 2000);
    } catch (err) {
      console.error("Error whitelisting governance:", err);
      setError(
        err instanceof Error ? err.message : "Failed to whitelist governance"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1 py-12">
        <div className="container px-4 md:px-6 mx-auto max-w-3xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl text-foreground mb-2">
              Whitelist Your Governance
            </h1>
            <p className="text-muted-foreground md:text-xl">
              Register your governance contract to make it available in the OTTER platform
            </p>
          </div>

          {success ? (
            <Alert className="bg-green-50 text-green-800 border-green-200 mb-6">
              <Check className="h-5 w-5 text-green-600" />
              <AlertTitle className="text-green-800 font-medium">Success!</AlertTitle>
              <AlertDescription className="text-green-700">
                Your governance has been whitelisted successfully. You will be redirected shortly.
              </AlertDescription>
            </Alert>
          ) : null}

          {error ? (
            <Alert className="bg-destructive/10 border-destructive/20 text-destructive mb-6">
              <AlertCircle className="h-5 w-5" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="address">Governance Address</Label>
              <Input
                id="address"
                name="address"
                placeholder="0x..."
                value={formData.address}
                onChange={handleChange}
                className="w-full"
                required
              />
              <p className="text-xs text-muted-foreground">
                Enter the Sui address of your governance contract package
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectName">Project Name</Label>
              <Input
                id="projectName"
                name="projectName"
                placeholder="Your project name"
                value={formData.projectName}
                onChange={handleChange}
                className="w-full"
                required
              />
              <p className="text-xs text-muted-foreground">
                The name that will be displayed in the governance list
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="details">Project Details</Label>
              <Textarea
                id="details"
                name="details"
                placeholder="Description of your governance project"
                value={formData.details}
                onChange={handleChange}
                className="w-full min-h-32"
                required
              />
              <p className="text-xs text-muted-foreground">
                A brief description of your project and its governance model
              </p>
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/governance")}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  "Whitelist Governance"
                )}
              </Button>
            </div>
          </form>

          <div className="mt-12 p-6 bg-muted/30 rounded-lg border border-border">
            <h2 className="font-semibold text-lg mb-4">About Whitelisting</h2>
            <p className="text-muted-foreground mb-4">
              Whitelisting your governance contract makes it discoverable in the OTTER platform, 
              allowing users to easily find and participate in your governance system.
            </p>
            <p className="text-muted-foreground">
              Once whitelisted, your contract will be indexed by our service, making proposals
              and voting available through our UI. Your governance module must expose standard
              functions like <code className="text-primary">create_proposal</code> to be fully compatible.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}