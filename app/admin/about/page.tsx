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
import { ArrowLeft, Loader2, Pencil, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { aboutUsService } from '@/app/service/aboutUsService';
import { languagesService } from "@/app/service/languagesService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import Image from 'next/image';

const formSchema = z.object({
  contact_address: z.string().min(3, "Address is required"),
  contact_phone: z.string().min(7, "Phone is required"),
  contact_email: z.string().email("Invalid email"),
  experience_years: z.string().regex(/^\d+$/, "Must be a number"),
  completed_projects: z.string().regex(/^\d+$/, "Must be a number"),
  professional_team: z.string().regex(/^\d+$/, "Must be a number"),
  locations: z.string().regex(/^\d+$/, "Must be a number"),
});

type Translation = {
  section_title: string;
  content: string;
};

type Service = {
  id: string;
  translations: Record<string, Translation>;
};

type OurStory = {
  id: string;
  translations: Record<string, Translation>;
};

type SocialLink = { 
  name: string; 
  url: string;
  isValid?: boolean;
};

export default function AboutUsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [originalData, setOriginalData] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [openStoryModal, setOpenStoryModal] = useState(false);
  const [openServiceModal, setOpenServiceModal] = useState<string | null>(null);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [ourStory, setOurStory] = useState<OurStory | null>(null);
  const [newService, setNewService] = useState<Service>({
    id: `temp-${Date.now()}`,
    translations: {
      en: { section_title: '', content: '' },
      fr: { section_title: '', content: '' },
      tr: { section_title: '', content: '' }
    }
  });
  const [showNewServiceForm, setShowNewServiceForm] = useState(false);

  const { languages, isLoading: isLanguagesLoading } = languagesService.useLanguages();
  const defaultLanguage = 'en'; // Force English as default display language

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
    },
  });

  useEffect(() => {
    if (!isLanguagesLoading) {
      fetchAboutUsInformation();
    }
  }, [isLanguagesLoading]);

  const fetchAboutUsInformation = async () => {
    setIsLoading(true);
    try {
      const res = await aboutUsService.getAboutUsInformation();
      console.log(res)
      setOriginalData(res);
      initializeFormData(res);
    } catch (error) {
      handleFetchError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const initializeFormData = (data: any) => {
    // Set form values
    form.reset({
      contact_address: data.contact_info?.Address || "",
      contact_phone: data.contact_info?.Phone || "",
      contact_email: data.contact_info?.Email || "",
      experience_years: data.statistics?.find((item: any) => item.label === "Years of Experience")?.value.toString() || "",
      completed_projects: data.statistics?.find((item: any) => item.label === "Completed Projects")?.value.toString() || "",
      professional_team: data.statistics?.find((item: any) => item.label === "Professional Team")?.value.toString() || "",
      locations: data.statistics?.find((item: any) => item.label === "Locations")?.value.toString() || "",
    });

    // Process social links
    const socialLinksData = data.contact_info?.Social_Links || {};
    const links = Object.entries(socialLinksData)
      .filter(([_, url]) => url)
      .map(([name, url]) => ({ 
        name, 
        url: url as string,
        isValid: validateUrl(url as string)
      }));
    setSocialLinks(links.length ? links : [{ name: "", url: "", isValid: false }]);

    // Process our story - ensure all languages are included
    if (data.our_story) {
      const translations: Record<string, Translation> = {
        en: data.our_story.translations.en || { section_title: 'Our Story', content: '' },
        fr: data.our_story.translations.fr || { section_title: '', content: '' },
        tr: data.our_story.translations.tr || { section_title: '', content: '' }
      };
      
      setOurStory({
        id: data.our_story.id,
        translations
      });
    } else {
      setOurStory({
        id: '',
        translations: {
          en: { section_title: 'Our Story', content: '' },
          fr: { section_title: '', content: '' },
          tr: { section_title: '', content: '' }
        }
      });
    }

    // Process services - ensure all languages are included for each service
    if (data.services) {
      const processedServices = data.services.map((service: any) => {
        const translations: Record<string, Translation> = {
          en: service.translations.en || { section_title: '', content: '' },
          fr: service.translations.fr || { section_title: '', content: '' },
          tr: service.translations.tr || { section_title: '', content: '' }
        };

        return {
          id: service.id,
          translations
        };
      });

      setServices(processedServices.length ? processedServices : [initializeEmptyService()]);
    } else {
      setServices([initializeEmptyService()]);
    }
  };

  const initializeEmptyService = (): Service => {
    return {
      id: `temp-${Date.now()}`,
      translations: {
        en: { section_title: '', content: '' },
        fr: { section_title: '', content: '' },
        tr: { section_title: '', content: '' }
      }
    };
  };

  const validateUrl = (url: string): boolean => {
    if (!url) return false;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const validateSocialLinks = () => {
    for (const link of socialLinks) {
      if (!link.name || !link.url) return false;
      if (!validateUrl(link.url)) return false;
    }
    return true;
  };

  const validateServices = () => {
    for (const service of services) {
      if (
        !service.translations.en.section_title ||
        !service.translations.en.content
      ) {
        return false;
      }
    }
    return true;
  };

  const validateOurStory = () => {
    return (
      !!ourStory?.translations.en.section_title &&
      !!ourStory?.translations.en.content
    );
  };

  const handleOurStoryChange = (lang: string, field: keyof Translation, value: string) => {
    setOurStory(prev => {
      if (!prev) return null;
      return {
        ...prev,
        translations: {
          ...prev.translations,
          [lang]: {
            ...prev.translations[lang],
            [field]: value
          }
        }
      };
    });
  };

  const handleServiceChange = (serviceId: string, lang: string, field: keyof Translation, value: string) => {
    setServices(prev => prev.map(service => 
      service.id === serviceId ? {
        ...service,
        translations: {
          ...service.translations,
          [lang]: {
            ...service.translations[lang],
            [field]: value
          }
        }
      } : service
    ));
  };

  const handleSocialLinkChange = (idx: number, field: keyof SocialLink, value: string) => {
    setSocialLinks(prev =>
      prev.map((link, i) => 
        i === idx ? { 
          ...link, 
          [field]: value,
          isValid: field === 'url' ? validateUrl(value) : link.isValid
        } : link
      )
    );
  };

  const addService = () => {
    setServices([...services, initializeEmptyService()]);
  };

  const removeService = (serviceId: string) => {
    if (services.length > 1) {
      setServices(services.filter(service => service.id !== serviceId));
    } else {
      toast({
        title: "Can't Remove",
        description: "You must have at least one service",
        variant: "destructive",
      });
    }
  };

  const addSocialLink = () => {
    setSocialLinks([...socialLinks, { name: "", url: "", isValid: false }]);
  };

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

  const handleAddNewService = () => {
    const hasContent = Object.values(newService.translations).some(
      t => t.section_title.trim() || t.content.trim()
    );
    if (!hasContent) {
      toast({
        title: "Error",
        description: "Please fill at least one language for the new service.",
        variant: "destructive",
      });
      return;
    }
    setServices(prev => [
      ...prev,
      { ...newService, id: `temp-${Date.now()}` }
    ]);
    setNewService({
      id: `temp-${Date.now()}`,
      translations: {
        en: { section_title: '', content: '' },
        fr: { section_title: '', content: '' },
        tr: { section_title: '', content: '' }
      }
    });
    setShowNewServiceForm(false);
  };

async function onSubmit(values: z.infer<typeof formSchema>) {
  // --- التحقق من الصحة ---
  if (!validateSocialLinks()) {
    toast({
      title: "Validation Error",
      description: "All social links must have valid names and URLs.",
      variant: "destructive",
    });
    return;
  }

  if (!validateServices()) {
    toast({
      title: "Validation Error",
      description: "Each service must have a title and description in English.",
      variant: "destructive",
    });
    return;
  }

  if (!validateOurStory()) {
    toast({
      title: "Validation Error",
      description: "Our Story must have a title and content in English.",
      variant: "destructive",
    });
    return;
  }

  setIsSaving(true);
  try {
    const changes: AboutUsChanges = {
      contact_info: [],
      statistics: [],
      our_story: [],
      services: {
        updates: [],
        creates: [],
        deletes: [],
      },
    };

    // --- Contact Info ---
    if (values.contact_address !== originalData?.contact_info?.Address) {
      changes.contact_info.push({
        field: "Address",
        value: values.contact_address,
      });
    }
    if (values.contact_phone !== originalData?.contact_info?.Phone) {
      changes.contact_info.push({
        field: "Phone",
        value: values.contact_phone,
      });
    }
    if (values.contact_email !== originalData?.contact_info?.Email) {
      changes.contact_info.push({
        field: "Email",
        value: values.contact_email,
      });
    }

    // --- Social Links: always send, even if not changed ---
    const newLinks: Record<string, string> = {};
    socialLinks.forEach((link) => {
      if (link.name && link.url && link.isValid) {
        newLinks[link.name] = link.url;
      }
    });
    changes.contact_info.push({
      field: "Social_Links",
      value: newLinks,
    });

    // --- Statistics ---
    const statsMap: Record<string, string> = {
      experience_years: "Years of Experience",
      completed_projects: "Completed Projects",
      professional_team: "Professional Team",
      locations: "Locations",
    };

    Object.entries(statsMap).forEach(([key, label]) => {
      const newVal = values[key as keyof typeof values] || "";
      const oldVal =
        originalData?.statistics?.find((item: any) => item.label === label)
          ?.value?.toString() || "";
      if (newVal !== oldVal) {
        changes.statistics.push({
          label,
          value: parseInt(newVal) || 0,
        });
      }
    });

    // --- Our Story ---
    if (ourStory) {
      ["en", "fr", "tr"].forEach((lang) => {
        const translation = ourStory.translations[lang];
        if (!translation) return;

        const oldTranslation =
          originalData?.our_story?.translations?.[lang] || {
            section_title: "",
            content: "",
          };

        if (
          translation.section_title !== oldTranslation.section_title ||
          translation.content !== oldTranslation.content
        ) {
          changes.our_story.push({
            id: ourStory.id,
            language: lang,
            section_title: translation.section_title,
            content: translation.content,
          });
        }
      });
    }

    // --- Services ---
    services.forEach((service) => {
      if (service.id.startsWith("temp-")) {
        const translations: Record<string, { section_title: string; content: string }> = {};
    
        ["en", "fr", "tr"].forEach((lang) => {
          const translation = service.translations[lang];
          if (translation && (translation.section_title || translation.content)) {
            translations[lang] = {
              section_title: translation.section_title,
              content: translation.content,
            };
          }
        });
    
        if (Object.keys(translations).length > 0) {
          changes.services.creates.push({ translations });
        }
      }
    });

    // الخدمات المحذوفة
    const originalIds = (originalData?.services || []).map((s: any) => s.id);
    const currentIds = services.map((s) => s.id);
    const removedIds = originalIds.filter(
      (id: string) => !currentIds.includes(id) && !id.startsWith("temp-")
    );
    removedIds.forEach((id: string) => {
      changes.services.deletes.push(id);
    });

    // --- Check for changes ---
    const hasChanges =
      changes.contact_info.length > 0 ||
      changes.statistics.length > 0 ||
      changes.our_story.length > 0 ||
      changes.services.creates.length > 0 ||
      changes.services.updates.length > 0 ||
      changes.services.deletes.length > 0;

    if (!hasChanges) {
      toast({
        title: "No Changes",
        description: "No changes were made to update.",
      });
      setIsSaving(false);
      return;
    }

    await aboutUsService.updateAboutUsInformation(changes);


    toast({
      title: "Success",
      description: "About Us information updated successfully!",
    });

    setEditMode(false);
    setOpenStoryModal(false);
    setOpenServiceModal(null);
    setShowNewServiceForm(false);
    await fetchAboutUsInformation();
  } catch (error) {
    console.error("Update error:", error);

    toast({
      title: "Error",
      description:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while updating",
      variant: "destructive",
    });
  } finally {
    setIsSaving(false);
  }
}

type AboutUsChanges = {
  contact_info: Array<{
    field: string;
    value: string | Record<string, string>;
  }>;
  statistics: Array<{
    label: string;
    value: number;
  }>;
  our_story: Array<{
    id: string;
    language: string;
    section_title: string;
    content: string;
  }>;
  services: {
    creates: Array<{
      translations: Record<
        string,
        {
          section_title: string;
          content: string;
        }
      >;
    }>;
    updates: Array<{
      id: string;
      language: string;
      section_title: string;
      content: string;
    }>;
    deletes: string[];
  };
};

  const handleFetchError = (error: unknown) => {
    console.error("Fetch error:", error);
    toast({
      title: "Error",
      description: "Failed to fetch information. Please try again.",
      variant: "destructive",
    });
    
    setSocialLinks([{ name: "", url: "", isValid: false }]);
    setOurStory({
      id: '',
      translations: {
        en: { section_title: 'Our Story', content: '' },
        fr: { section_title: '', content: '' },
        tr: { section_title: '', content: '' }
      }
    });
    setServices([initializeEmptyService()]);
  };

  if (isLoading || isLanguagesLoading) {
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
        {!editMode && (
          <Button
            variant="default"
            className="ml-auto"
            onClick={() => setEditMode(true)}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>About Us Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-10"
              autoComplete="off"
            >
              <div className="border rounded-xl p-6 space-y-4 shadow-sm">
                <h2 className="text-lg font-semibold mb-4">📍 Contact Information</h2>
                <FormField
                  control={form.control}
                  name="contact_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter Address"
                          {...field}
                          disabled={!editMode}
                        />
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
                        <Input
                          placeholder="Enter Phone"
                          {...field}
                          disabled={!editMode}
                        />
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
                        <Input
                          placeholder="Enter Email"
                          {...field}
                          disabled={!editMode}
                        />
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
                        onChange={e => handleSocialLinkChange(idx, "name", e.target.value)}
                        disabled={!editMode}
                      />
                    </div>
                    <div className="flex-1">
                      <Input
                        type="url"
                        placeholder="https://..."
                        value={link.url}
                        onChange={e => handleSocialLinkChange(idx, "url", e.target.value)}
                        disabled={!editMode}
                        className={!link.isValid && link.url ? "border-red-500" : ""}
                      />
                    </div>
                    {editMode && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => removeSocialLink(idx)}
                        disabled={socialLinks.length <= 1}
                        title="Remove"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                {editMode && (
                  <Button type="button" variant="outline" onClick={addSocialLink}>
                    + Add Social Link
                  </Button>
                )}
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
                        <Input
                          placeholder="Enter Years of Experience"
                          {...field}
                          disabled={!editMode}
                        />
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
                        <Input
                          placeholder="Enter Completed Projects"
                          {...field}
                          disabled={!editMode}
                        />
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
                        <Input
                          placeholder="Enter Team Size"
                          {...field}
                          disabled={!editMode}
                        />
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
                        <Input
                          placeholder="Enter Number of Locations"
                          {...field}
                          disabled={!editMode}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="border rounded-xl p-6 space-y-4 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">📖 Our Story</h2>
                  {editMode && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setOpenStoryModal(true)}
                    >
                      Edit Translations
                    </Button>
                  )}
                </div>
                
                {ourStory && (
                  <div className="space-y-4">
                    <h3 className="font-medium">
                      {ourStory.translations.en?.section_title || "Our Story"}
                    </h3>
                    <p className="text-muted-foreground whitespace-pre-line">
                      {ourStory.translations.en?.content || "No story content available."}
                    </p>
                  </div>
                )}
              </div>

              {ourStory && (
                <Dialog open={openStoryModal} onOpenChange={setOpenStoryModal}>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Edit Our Story Translations</DialogTitle>
                    </DialogHeader>
                    
                    <Tabs defaultValue="en">
                      <TabsList className="grid w-full grid-cols-3">
                        {languages && languages.map((lang) => (
                            <TabsTrigger key={lang.code} value={lang.code}>
                                <span className="flex items-center gap-2">
                                    <Image
                                        src={`https://api.iconify.design/circle-flags:lang-${lang.code}.svg`}
                                        alt={lang.name}
                                        width={18}
                                        height={18}
                                        className="rounded-full"
                                    />
                                    {lang.name}
                                </span>
                            </TabsTrigger>
                        ))}
                        </TabsList>
                      
                      <TabsContent value="en" className="space-y-4 pt-4">
                        <Input
                          placeholder="Story Title (English)"
                          value={ourStory.translations.en?.section_title || ""}
                          onChange={e => handleOurStoryChange('en', 'section_title', e.target.value)}
                        />
                        <Textarea
                          placeholder="Story Content (English)"
                          className="min-h-[200px]"
                          value={ourStory.translations.en?.content || ""}
                          onChange={e => handleOurStoryChange('en', 'content', e.target.value)}
                        />
                      </TabsContent>
                      
                      <TabsContent value="fr" className="space-y-4 pt-4">
                        <Input
                          placeholder="Story Title (French)"
                          value={ourStory.translations.fr?.section_title || ""}
                          onChange={e => handleOurStoryChange('fr', 'section_title', e.target.value)}
                        />
                        <Textarea
                          placeholder="Story Content (French)"
                          className="min-h-[200px]"
                          value={ourStory.translations.fr?.content || ""}
                          onChange={e => handleOurStoryChange('fr', 'content', e.target.value)}
                        />
                      </TabsContent>
                      
                      <TabsContent value="tr" className="space-y-4 pt-4">
                        <Input
                          placeholder="Story Title (Turkish)"
                          value={ourStory.translations.tr?.section_title || ""}
                          onChange={e => handleOurStoryChange('tr', 'section_title', e.target.value)}
                        />
                        <Textarea
                          placeholder="Story Content (Turkish)"
                          className="min-h-[200px]"
                          value={ourStory.translations.tr?.content || ""}
                          onChange={e => handleOurStoryChange('tr', 'content', e.target.value)}
                        />
                      </TabsContent>
                    </Tabs>
                  </DialogContent>
                </Dialog>
              )}

              <div className="border rounded-xl p-6 space-y-4 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">🛠️ Services</h2>
                  {editMode && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowNewServiceForm(true)}
                    >
                      + Add Service
                    </Button>
                  )}
                </div>
                {editMode && showNewServiceForm && (
                  <div className="border rounded-lg p-4 mb-4 bg-muted">
                    <Tabs defaultValue="en">
                      <TabsList className="grid w-full grid-cols-3">
                        {languages && languages.map((lang) => (
                            <TabsTrigger key={lang.code} value={lang.code}>
                                <span className="flex items-center gap-2">
                                    <Image
                                        src={`https://api.iconify.design/circle-flags:lang-${lang.code}.svg`}
                                        alt={lang.name}
                                        width={18}
                                        height={18}
                                        className="rounded-full"
                                    />
                                    {lang.name}
                                </span>
                            </TabsTrigger>
                        ))}
                      </TabsList>
                      <TabsContent value="en" className="space-y-4 pt-4">
                        <Input
                          placeholder="Service Title (English)"
                          value={newService.translations.en.section_title}
                          onChange={e => setNewService(ns => ({
                            ...ns,
                            translations: {
                              ...ns.translations,
                              en: {
                                ...ns.translations.en,
                                section_title: e.target.value
                              }
                            }
                          }))}
                        />
                        <Textarea
                          placeholder="Service Description (English)"
                          className="min-h-[150px]"
                          value={newService.translations.en.content}
                          onChange={e => setNewService(ns => ({
                            ...ns,
                            translations: {
                              ...ns.translations,
                              en: {
                                ...ns.translations.en,
                                content: e.target.value
                              }
                            }
                          }))}
                        />
                      </TabsContent>
                      <TabsContent value="fr" className="space-y-4 pt-4">
                        <Input
                          placeholder="Service Title (French)"
                          value={newService.translations.fr.section_title}
                          onChange={e => setNewService(ns => ({
                            ...ns,
                            translations: {
                              ...ns.translations,
                              fr: {
                                ...ns.translations.fr,
                                section_title: e.target.value
                              }
                            }
                          }))}
                        />
                        <Textarea
                          placeholder="Service Description (French)"
                          className="min-h-[150px]"
                          value={newService.translations.fr.content}
                          onChange={e => setNewService(ns => ({
                            ...ns,
                            translations: {
                              ...ns.translations,
                              fr: {
                                ...ns.translations.fr,
                                content: e.target.value
                              }
                            }
                          }))}
                        />
                      </TabsContent>
                      <TabsContent value="tr" className="space-y-4 pt-4">
                        <Input
                          placeholder="Service Title (Turkish)"
                          value={newService.translations.tr.section_title}
                          onChange={e => setNewService(ns => ({
                            ...ns,
                            translations: {
                              ...ns.translations,
                              tr: {
                                ...ns.translations.tr,
                                section_title: e.target.value
                              }
                            }
                          }))}
                        />
                        <Textarea
                          placeholder="Service Description (Turkish)"
                          className="min-h-[150px]"
                          value={newService.translations.tr.content}
                          onChange={e => setNewService(ns => ({
                            ...ns,
                            translations: {
                              ...ns.translations,
                              tr: {
                                ...ns.translations.tr,
                                content: e.target.value
                              }
                            }
                          }))}
                        />
                      </TabsContent>
                    </Tabs>
                    <div className="flex gap-2 mt-4">
                      <Button type="button" onClick={handleAddNewService}>
                        Add Service
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setShowNewServiceForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
                <div className="space-y-6">
                  {services.map(service => (
                    <div key={service.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <h3 className="font-medium">
                            {service.translations.en?.section_title || "Untitled Service"}
                          </h3>
                          <p className="text-muted-foreground whitespace-pre-line">
                            {service.translations.en?.content || "No description available."}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {editMode && (
                            <>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setOpenServiceModal(service.id)}
                              >
                                Edit Translations
                              </Button>
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                onClick={() => removeService(service.id)}
                                disabled={services.length <= 1}
                                title="Remove"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Dialog 
                open={openServiceModal !== null} 
                onOpenChange={(open) => !open && setOpenServiceModal(null)}
              >
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Edit Service Translations</DialogTitle>
                  </DialogHeader>
                  
                  {openServiceModal && (
                    <Tabs defaultValue="en">
                      <TabsList className="grid w-full grid-cols-3">
                        {languages && languages.map((lang) => (
                              <TabsTrigger key={lang.code} value={lang.code}>
                                  <span className="flex items-center gap-2">
                                      <Image
                                          src={`https://api.iconify.design/circle-flags:lang-${lang.code}.svg`}
                                          alt={lang.name}
                                          width={18}
                                          height={18}
                                          className="rounded-full"
                                      />
                                      {lang.name}
                                  </span>
                              </TabsTrigger>
                          ))}
                      </TabsList>
                      
                      {services.map(service => {
                        if (service.id !== openServiceModal) return null;
                        
                        return (
                          <>
                            <TabsContent key="en" value="en" className="space-y-4 pt-4">
                              <Input
                                placeholder="Service Title (English)"
                                value={service.translations.en?.section_title || ""}
                                onChange={e => handleServiceChange(service.id, 'en', 'section_title', e.target.value)}
                              />
                              <Textarea
                                placeholder="Service Description (English)"
                                className="min-h-[150px]"
                                value={service.translations.en?.content || ""}
                                onChange={e => handleServiceChange(service.id, 'en', 'content', e.target.value)}
                              />
                            </TabsContent>
                            
                            <TabsContent key="fr" value="fr" className="space-y-4 pt-4">
                              <Input
                                placeholder="Service Title (French)"
                                value={service.translations.fr?.section_title || ""}
                                onChange={e => handleServiceChange(service.id, 'fr', 'section_title', e.target.value)}
                              />
                              <Textarea
                                placeholder="Service Description (French)"
                                className="min-h-[150px]"
                                value={service.translations.fr?.content || ""}
                                onChange={e => handleServiceChange(service.id, 'fr', 'content', e.target.value)}
                              />
                            </TabsContent>
                            
                            <TabsContent key="tr" value="tr" className="space-y-4 pt-4">
                              <Input
                                placeholder="Service Title (Turkish)"
                                value={service.translations.tr?.section_title || ""}
                                onChange={e => handleServiceChange(service.id, 'tr', 'section_title', e.target.value)}
                              />
                              <Textarea
                                placeholder="Service Description (Turkish)"
                                className="min-h-[150px]"
                                value={service.translations.tr?.content || ""}
                                onChange={e => handleServiceChange(service.id, 'tr', 'content', e.target.value)}
                              />
                            </TabsContent>
                          </>
                        );
                      })}
                    </Tabs>
                  )}
                </DialogContent>
              </Dialog>

              {editMode && (
                <div className="flex justify-end gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditMode(false);
                      setOpenStoryModal(false);
                      setOpenServiceModal(null);
                      setShowNewServiceForm(false);
                      fetchAboutUsInformation();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                </div>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}