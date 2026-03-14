"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { FormSelectField, FormTextField } from "@/components/forms/form-fields";
import { OnboardingStepper, type OnboardingStepItem } from "@/components/platform-admin/onboarding-stepper";
import { PlatformAdminGuard } from "@/components/platform-admin/platform-admin-guard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui-extensions/page-header";
import {
  createCity,
  createOrganization,
  createUser,
  createWard,
  createZone,
  listOrganizations,
} from "@/lib/api/services";
import { queryKeys } from "@/types/query-keys";

const SELECT_EXISTING = "__existing__";
const NO_ORGANIZATION_SELECTED = "__no_org_selected__";

export default function CityOnboardingPage() {
  const queryClient = useQueryClient();
  const [orgMode, setOrgMode] = useState(SELECT_EXISTING);
  const [selectedOrgId, setSelectedOrgId] = useState(NO_ORGANIZATION_SELECTED);
  const [seedDefaults, setSeedDefaults] = useState(true);

  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [orgType, setOrgType] = useState("municipal");

  const [cityName, setCityName] = useState("");
  const [cityState, setCityState] = useState("");
  const [cityCountry, setCityCountry] = useState("India");

  const [wardName, setWardName] = useState("");
  const [wardCode, setWardCode] = useState("");

  const [zoneName, setZoneName] = useState("");
  const [zoneCode, setZoneCode] = useState("");

  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPhone, setAdminPhone] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  const [createdCityId, setCreatedCityId] = useState("");
  const [createdWardId, setCreatedWardId] = useState("");

  const organizationsQuery = useQuery({
    queryKey: queryKeys.organizations.list(),
    queryFn: () => listOrganizations(),
  });

  const createOrganizationMutation = useMutation({
    mutationFn: () => createOrganization({ name: orgName, slug: orgSlug, type: orgType, is_active: true }),
    onSuccess: (org) => {
      setSelectedOrgId(org.id);
      toast.success("Organization created");
      void queryClient.invalidateQueries({ queryKey: queryKeys.organizations.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.platformAdmin.all });
    },
  });

  const createCityMutation = useMutation({
    mutationFn: () => createCity({ organization_id: effectiveOrgId, name: cityName, state: cityState, country: cityCountry, is_active: true }),
    onSuccess: (city) => {
      setCreatedCityId(city.id);
      toast.success("City created");
      void queryClient.invalidateQueries({ queryKey: queryKeys.cities.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.platformAdmin.all });
    },
  });

  const createWardMutation = useMutation({
    mutationFn: () => createWard({ city_id: createdCityId, name: wardName, code: wardCode, is_active: true }),
    onSuccess: (ward) => {
      setCreatedWardId(ward.id);
      toast.success("Ward created");
      void queryClient.invalidateQueries({ queryKey: queryKeys.wards.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.platformAdmin.all });
    },
  });

  const createZoneMutation = useMutation({
    mutationFn: () => createZone({ ward_id: createdWardId, name: zoneName, code: zoneCode, is_active: true }),
    onSuccess: () => {
      toast.success("Zone created");
      void queryClient.invalidateQueries({ queryKey: queryKeys.zones.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.platformAdmin.all });
    },
  });

  const createAdminMutation = useMutation({
    mutationFn: () =>
      createUser({
        organization_id: effectiveOrgId,
        city_id: createdCityId,
        ward_id: createdWardId || null,
        zone_id: null,
        full_name: adminName,
        email: adminEmail,
        phone: adminPhone || null,
        password: adminPassword,
        is_superuser: false,
        is_active: true,
        is_verified: true,
        role_codes: ["CITY_ADMIN"],
      }),
    onSuccess: () => {
      toast.success("Initial admin user created");
      void queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.platformAdmin.all });
    },
  });

  const normalizedOrgId = selectedOrgId === NO_ORGANIZATION_SELECTED ? "" : selectedOrgId;
  const effectiveOrgId = normalizedOrgId;
  const canCreateCity = Boolean(effectiveOrgId);
  const canCreateWard = Boolean(createdCityId);
  const canCreateZone = Boolean(createdWardId);
  const canCreateAdmin = Boolean(createdCityId && effectiveOrgId);

  const steps = useMemo<OnboardingStepItem[]>(() => {
    const stepState = (done: boolean, active: boolean): OnboardingStepItem["state"] => (done ? "done" : active ? "active" : "pending");
    return [
      {
        key: "organization",
        title: "Organization Selection or Creation",
        description: "Select existing tenant organization or create a new one.",
        state: stepState(Boolean(effectiveOrgId), !effectiveOrgId),
      },
      {
        key: "city",
        title: "City Creation",
        description: "Create city record and bind to the selected organization.",
        state: stepState(Boolean(createdCityId), Boolean(effectiveOrgId) && !createdCityId),
      },
      {
        key: "ward",
        title: "Ward Setup",
        description: "Create the first operational ward for role and route scoping.",
        state: stepState(Boolean(createdWardId), Boolean(createdCityId) && !createdWardId),
      },
      {
        key: "zone",
        title: "Zone Setup",
        description: "Optionally seed an initial zone for routing and source segmentation.",
        state: stepState(createZoneMutation.isSuccess, Boolean(createdWardId) && !createZoneMutation.isSuccess),
      },
      {
        key: "admin",
        title: "Initial Admin User Setup",
        description: "Create first CITY_ADMIN account for tenant launch.",
        state: stepState(createAdminMutation.isSuccess, Boolean(createdCityId) && !createAdminMutation.isSuccess),
      },
    ];
  }, [effectiveOrgId, createdCityId, createdWardId, createZoneMutation.isSuccess, createAdminMutation.isSuccess]);

  return (
    <PlatformAdminGuard>
      <div className="space-y-6">
        <PageHeader
          title="City Onboarding"
          description="Guided onboarding for tenant setup, city hierarchy, and initial administration."
        />

        <div className="grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
          <OnboardingStepper steps={steps} />

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Step 1: Organization</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <FormSelectField
                  label="Mode"
                  value={orgMode}
                  onChange={setOrgMode}
                  options={[
                    { label: "Select Existing Organization", value: SELECT_EXISTING },
                    { label: "Create New Organization", value: "create" },
                  ]}
                />
                {orgMode === SELECT_EXISTING ? (
                  <FormSelectField
                    label="Organization"
                    value={selectedOrgId}
                    onChange={setSelectedOrgId}
                    options={[
                      { label: "Select an organization", value: NO_ORGANIZATION_SELECTED },
                      ...(organizationsQuery.data ?? []).map((org) => ({ label: `${org.name} (${org.slug})`, value: org.id })),
                    ]}
                  />
                ) : (
                  <div className="grid gap-3 md:grid-cols-3">
                    <FormTextField label="Organization Name" value={orgName} onChange={setOrgName} />
                    <FormTextField label="Slug" value={orgSlug} onChange={setOrgSlug} />
                    <FormTextField label="Type" value={orgType} onChange={setOrgType} />
                    <Button
                      type="button"
                      onClick={() => void createOrganizationMutation.mutateAsync()}
                      disabled={!orgName || !orgSlug || !orgType || createOrganizationMutation.isPending}
                      className="md:col-span-3"
                    >
                      {createOrganizationMutation.isPending ? "Creating organization..." : "Create Organization"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Step 2: City</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-3">
                <FormTextField label="City Name" value={cityName} onChange={setCityName} disabled={!canCreateCity} />
                <FormTextField label="State" value={cityState} onChange={setCityState} disabled={!canCreateCity} />
                <FormTextField label="Country" value={cityCountry} onChange={setCityCountry} disabled={!canCreateCity} />
                <Button
                  type="button"
                  onClick={() => void createCityMutation.mutateAsync()}
                  disabled={!canCreateCity || !cityName || !cityState || !cityCountry || createCityMutation.isPending}
                  className="md:col-span-3"
                >
                  {createCityMutation.isPending ? "Creating city..." : "Create City"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Step 3: Ward</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                <FormTextField label="Ward Name" value={wardName} onChange={setWardName} disabled={!canCreateWard} />
                <FormTextField label="Ward Code" value={wardCode} onChange={setWardCode} disabled={!canCreateWard} />
                <Button
                  type="button"
                  onClick={() => void createWardMutation.mutateAsync()}
                  disabled={!canCreateWard || !wardName || !wardCode || createWardMutation.isPending}
                  className="md:col-span-2"
                >
                  {createWardMutation.isPending ? "Creating ward..." : "Create Ward"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Step 4: Zone (Optional)</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                <FormTextField label="Zone Name" value={zoneName} onChange={setZoneName} disabled={!canCreateZone} />
                <FormTextField label="Zone Code" value={zoneCode} onChange={setZoneCode} disabled={!canCreateZone} />
                <Button
                  type="button"
                  onClick={() => void createZoneMutation.mutateAsync()}
                  disabled={!canCreateZone || !zoneName || !zoneCode || createZoneMutation.isPending}
                  className="md:col-span-2"
                >
                  {createZoneMutation.isPending ? "Creating zone..." : "Create Zone"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Step 5: Initial Admin User</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <FormTextField label="Full Name" value={adminName} onChange={setAdminName} disabled={!canCreateAdmin} />
                  <FormTextField label="Email" value={adminEmail} onChange={setAdminEmail} type="email" disabled={!canCreateAdmin} />
                  <FormTextField label="Phone" value={adminPhone} onChange={setAdminPhone} disabled={!canCreateAdmin} />
                  <FormTextField label="Password" value={adminPassword} onChange={setAdminPassword} type="password" disabled={!canCreateAdmin} />
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" checked={seedDefaults} onChange={(event) => setSeedDefaults(event.target.checked)} />
                  Apply default role/seed configuration guidance
                </label>
                <p className="text-xs text-slate-500">Seed guidance is currently informational. Core role data is initialized by backend startup seed logic.</p>
                <Button
                  type="button"
                  onClick={() => void createAdminMutation.mutateAsync()}
                  disabled={!canCreateAdmin || !adminName || !adminEmail || adminPassword.length < 8 || createAdminMutation.isPending}
                  className="w-full"
                >
                  {createAdminMutation.isPending ? "Creating admin..." : "Create Initial Admin"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PlatformAdminGuard>
  );
}
