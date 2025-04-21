"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { aboutUsService } from '@/app/service/aboutUsService';

const formSchema = z.object({
    contact_address: z.string().optional(),
    contact_phone: z.string().optional(),
    contact_email: z.string().optional(),
    experience_years: z.string().optional(),
    completed_projects: z.string().optional(),
    professional_team: z.string().optional(),
    locations: z.string().optional(),
    our_story: z.string().optional(),
});

type SocialLink = { name: string; url: string };
type Service = { name: string; description: string };

export default function AboutUsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize with empty arrays instead of predefined data
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [originalData, setOriginalData] = useState<any>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contact_address: "",
      contact_phone: "",
      contact_email: "",
      experience_years: "",
      completed_projects: "",
      professional_team: "",
      locations: "",
      our_story: "",
    },
  });

    const fetchAboutUsInformation = async () => {
        setIsLoading(true);
        try {
        const res = await aboutUsService.getAboutUsInformation();
        setOriginalData(res); // حفظ البيانات الأصلية للمقارنة لاحقًا
        console.log
        // Reset form with data from API
        form.reset({
            
            contact_address: res.contact_info.find((item: any) => item.section_title === "Address")?.content || "",
            contact_phone: res.contact_info.find((item: any) => item.section_title === "Phone")?.content || "",
            contact_email: res.contact_info.find((item: any) => item.section_title === "Email")?.content || "",
            experience_years: res.statistics.find((item: any) => item.section_title === "Years of Experience")?.content || "",
            completed_projects: res.statistics.find((item: any) => item.section_title === "Completed Projects")?.content || "",
            professional_team: res.statistics.find((item: any) => item.section_title === "Professional Team")?.content || "",
            locations: res.statistics.find((item: any) => item.section_title === "Locations")?.content || "",
            our_story: res.our_story.find((item: any) => item.section_title === "Our Story")?.content || "",
        });

        // Parse social links from API
        const socialLinksItem = res.contact_info.find((item: any) => item.section_title === "Social Links");
        let parsedLinks: SocialLink[] = [];
        
        if (socialLinksItem?.content) {
            try {
            const parsed = JSON.parse(socialLinksItem.content);
            parsedLinks = Object.entries(parsed).map(([name, url]) => ({ 
                name, 
                url: url as string 
            }));
            } catch (error) {
            console.error("Error parsing social links:", error);
            }
        }
        
        // Set social links (use empty array if no data)
        setSocialLinks(parsedLinks.length ? parsedLinks : []);
        
        // If no social links are returned, add an empty one for the user to fill
        if (parsedLinks.length === 0) {
            setSocialLinks([{ name: "", url: "" }]);
        }

        // Parse services from API
        const loadedServices: Service[] = Array.isArray(res.services)
            ? res.services.map((item: any) => ({
                name: item.section_title || "",
                description: item.content || "",
            }))
            : [];
        
        // Set services (use empty array if no data)
        setServices(loadedServices.length ? loadedServices : []);
        
        // If no services are returned, add an empty one for the user to fill
        if (loadedServices.length === 0) {
            setServices([{ name: "", description: "" }]);
        }
        
        } catch (error) {
        console.error('Error fetching about us information:', error);
        toast({
            title: "Error",
            description: "Failed to fetch information. Please try again.",
            variant: "destructive",
        });
        
        // Initialize with one empty item each if API fails
        setSocialLinks([{ name: "", url: "" }]);
        setServices([{ name: "", description: "" }]);
        
        } finally {
        setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAboutUsInformation();
    }, []);

    const handleSocialLinkChange = (idx: number, field: keyof SocialLink, value: string) => {
        setSocialLinks((prev) =>
        prev.map((link, i) => (i === idx ? { ...link, [field]: value } : link))
        );
    };

    const addSocialLink = () => setSocialLinks([...socialLinks, { name: "", url: "" }]);

  const removeSocialLink = (idx: number) => {
    if (socialLinks.length > 1) {
      setSocialLinks(socialLinks.filter((_, i) => i !== idx));
    } else {
      toast({
        title: "Can't Remove",
        description: "You must have at least one social link",
        variant: "destructive",
      });
    }
  };

  const handleServiceChange = (idx: number, field: keyof Service, value: string) => {
    setServices((prev) =>
      prev.map((srv, i) => (i === idx ? { ...srv, [field]: value } : srv))
    );
  };
  
  const addService = () => setServices([...services, { name: "", description: "" }]);
  
  const removeService = (idx: number) => {
    if (services.length > 1) {
      setServices(services.filter((_, i) => i !== idx));
    } else {
      toast({
        title: "Can't Remove",
        description: "You must have at least one service",
        variant: "destructive",
      });
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSaving(true);
    try {
      if (!originalData) {
        toast({
          title: "Error",
          description: "Original data not loaded.",
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }

      const changes: any[] = [];
      const deletedIds: { [type: string]: number[] } = {};

      // --- contact_info ---
      const contactFields = [
        { key: "contact_address", section: "Address" },
        { key: "contact_phone", section: "Phone" },
        { key: "contact_email", section: "Email" },
      ];
      contactFields.forEach(({ key, section }) => {
        const oldItem = originalData.contact_info.find((item: any) => item.section_title === section);
        const oldVal = oldItem?.content || "";
        const newVal = values[key as keyof typeof values] || "";
        if (oldItem && oldVal !== newVal) {
          changes.push({
            type: "contact_info",
            id: oldItem.id,
            section_title: section,
            content: newVal,
          });
        }
      });

      // --- Social Links ---
      const oldLinksItem = originalData.contact_info.find((item: any) => item.section_title === "Social Links");
      let oldLinks: Record<string, string> = {};
      try {
        oldLinks = oldLinksItem?.content ? JSON.parse(oldLinksItem.content) : {};
      } catch {}
      const newLinks: Record<string, string> = {};
      socialLinks.forEach((link) => {
        if (link.name && link.url) newLinks[link.name] = link.url;
      });
      if (JSON.stringify(oldLinks) !== JSON.stringify(newLinks)) {
        changes.push({
          type: "contact_info",
          id: oldLinksItem?.id,
          section_title: "Social Links",
          content: JSON.stringify(newLinks),
        });
      }

      // --- statistics ---
      const statFields = [
        { key: "experience_years", section: "Years of Experience" },
        { key: "completed_projects", section: "Completed Projects" },
        { key: "professional_team", section: "Professional Team" },
        { key: "locations", section: "Locations" },
      ];
      statFields.forEach(({ key, section }) => {
        const oldItem = originalData.statistics.find((item: any) => item.section_title === section);
        const oldVal = oldItem?.content || "";
        const newVal = values[key as keyof typeof values] || "";
        if (oldItem && oldVal !== newVal) {
          changes.push({
            type: "statistics",
            id: oldItem.id,
            section_title: section,
            content: newVal,
          });
        }
      });

      // --- our_story ---
      const oldStoryItem = originalData.our_story.find((item: any) => item.section_title === "Our Story");
      const oldStory = oldStoryItem?.content || "";
      const newStory = values.our_story || "";
      if (oldStoryItem && oldStory !== newStory) {
        changes.push({
          type: "our_story",
          id: oldStoryItem.id,
          section_title: "Our Story",
          content: newStory,
        });
      }

      // --- services ---
      // Map old services by section_title for comparison
      const oldServicesMap: Record<string, { id: number, content: string }> = {};
      if (Array.isArray(originalData.services)) {
        originalData.services.forEach((item: any) => {
          oldServicesMap[item.section_title] = { id: item.id, content: item.content };
        });
      }
      // Map new services by name
      const newServicesMap: Record<string, string> = {};
      services.forEach((srv) => {
        if (srv.name && srv.description) newServicesMap[srv.name] = srv.description;
      });

      // Find changed or new services
      Object.entries(newServicesMap).forEach(([name, desc]) => {
        if (name in oldServicesMap) {
          if (oldServicesMap[name].content !== desc) {
            changes.push({
              type: "services",
              id: oldServicesMap[name].id,
              section_title: name,
              content: desc,
            });
          }
        } else {
          // New service (no id)
          changes.push({
            type: "services",
            section_title: name,
            content: desc,
          });
        }
      });
      // Find removed services
      Object.entries(oldServicesMap).forEach(([name, { id }]) => {
        if (!(name in newServicesMap)) {
          if (!deletedIds.services) deletedIds.services = [];
          deletedIds.services.push(id);
        }
      });

      // --- حذف contact_info/our_story/statistics (نادراً ما يحدث، لكن يدعم) ---
      // مثال: إذا أردت دعم حذف contact_info أو statistics أو our_story أضف منطق مشابه للخدمات هنا

      // --- تجميع حذف الخدمات ---
      if (deletedIds.services && deletedIds.services.length > 0) {
        changes.push({
          type: "services",
          ids: deletedIds.services,
          action: "delete",
        });
      }

      // إذا لا يوجد تغييرات
      if (changes.length === 0) {
        toast({
          title: "No Changes",
          description: "No changes to update.",
        });
        setIsSaving(false);
        return;
      }

      // إرسال التغييرات فقط
      await aboutUsService.updateAboutUsInformation(changes);

      toast({
        title: "Success",
        description: "About Us updated successfully",
      });

      // router.push('/admin');
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update About Us",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading About Us information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <div className="flex items-center gap-4">
        <Link href="/admin">
            <Button variant="ghost">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
            </Button>
        </Link>
        <h1 className="text-3xl font-bold">Edit About Us</h1>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>About Us Details</CardTitle>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
                        <div className="border rounded-xl p-6 space-y-4 shadow-sm">
                        <h2 className="text-lg font-semibold mb-4">📍 Contact Information</h2>

                        <FormField
                            control={form.control}
                            name="contact_address"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Address</FormLabel>
                                <FormControl>
                                <Input placeholder="Enter Address" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="contact_phone"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Phone</FormLabel>
                                <FormControl>
                                <Input placeholder="Enter Phone" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="contact_email"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                <Input placeholder="Enter Email" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        </div>

                        <div className="border rounded-xl p-6 space-y-4 shadow-sm">
                        <h2 className="text-lg font-semibold mb-4">🔗 Social Links</h2>
                        {socialLinks.map((link, idx) => (
                            <div key={idx} className="flex items-end gap-2">
                            <div className="flex-1">
                                <Input
                                placeholder="Platform (e.g. facebook)"
                                value={link.name}
                                onChange={(e) => handleSocialLinkChange(idx, "name", e.target.value)}
                                />
                            </div>
                            <div className="flex-1">
                                <Input
                                type="url"
                                placeholder="https://..."
                                value={link.url}
                                onChange={(e) => handleSocialLinkChange(idx, "url", e.target.value)}
                                />
                            </div>
                            <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                onClick={() => removeSocialLink(idx)}
                                disabled={socialLinks.length <= 1}
                                title="Remove"
                            >
                                ×
                            </Button>
                            </div>
                        ))}
                        <Button type="button" variant="outline" onClick={addSocialLink}>
                            + Add Social Link
                        </Button>
                        </div>

                        <div className="border rounded-xl p-6 space-y-4 shadow-sm">
                        <h2 className="text-lg font-semibold mb-4">📊 Company Statistics</h2>

                        <FormField
                            control={form.control}
                            name="experience_years"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Years of Experience</FormLabel>
                                <FormControl>
                                <Input placeholder="Enter Years of Experience" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="completed_projects"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Completed Projects</FormLabel>
                                <FormControl>
                                <Input placeholder="Enter Completed Projects" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="professional_team"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Professional Team</FormLabel>
                                <FormControl>
                                <Input placeholder="Enter Team Size" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="locations"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Locations</FormLabel>
                                <FormControl>
                                <Input placeholder="Enter Number of Locations" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        </div>

                        <div className="border rounded-xl p-6 space-y-4 shadow-sm">
                        <h2 className="text-lg font-semibold mb-4">📖 Our Story</h2>

                        <FormField
                            control={form.control}
                            name="our_story"
                            render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                <Textarea
                                    placeholder="Enter company story..."
                                    className="min-h-[120px]"
                                    {...field}
                                />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        </div>

                        <div className="border rounded-xl p-6 space-y-4 shadow-sm">
                        <h2 className="text-lg font-semibold mb-4">🛠️ Services</h2>
                        {services.map((srv, idx) => (
                            <div key={idx} className="flex items-end gap-2">
                            <div className="flex-1">
                                <Input
                                placeholder="Service Name"
                                value={srv.name}
                                onChange={(e) => handleServiceChange(idx, "name", e.target.value)}
                                />
                            </div>
                            <div className="flex-[2]">
                                <Textarea
                                placeholder="Service Description"
                                className="min-h-[60px]"
                                value={srv.description}
                                onChange={(e) => handleServiceChange(idx, "description", e.target.value)}
                                />
                            </div>
                            <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                onClick={() => removeService(idx)}
                                disabled={services.length <= 1}
                                title="Remove"
                            >
                                ×
                            </Button>
                            </div>
                        ))}
                        <Button type="button" variant="outline" onClick={addService}>
                            + Add Service
                        </Button>
                        </div>

                        <div className="flex justify-end gap-4">
                        <Button type="button" variant="outline" onClick={() => router.push('/admin')}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    </div>
  );
}