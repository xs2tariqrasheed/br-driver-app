import Button from "@/components/Button";
import Header from "@/components/Header";
import InfoTable, { InfoTableDataItem } from "@/components/InfoTable";
import Logo from "@/components/Logo";
import Typography from "@/components/Typography";
import { textColors } from "@/constants/colors";
import { SYSTEM_SETTINGS_KEYS } from "@/constants/global";
import { PROFILE_CONTENT_KEYS } from "@/content/profile-keys";
import { useAuth } from "@/context/AuthContext";
import { useDriver } from "@/context/DriverContext";
import { useGetContent } from "@/hooks/useGetContent";
import { Stack, useRouter } from "expo-router";
import { useMemo } from "react";
import { SafeAreaView, ScrollView, StyleSheet, View } from "react-native";

export default function ProfileScreen() {
  const { getContent } = useGetContent();
  const {
    headerTitle,
    nameFallback,
    valueNa,
    sectionPersonalLabel,
    sectionContactLabel,
    sectionDriverDetailsLabel,
    sectionActivityLabel,
    sectionPaymentLabel,
    personalFullNameLabel,
    personalDateOfBirthLabel,
    personalGenderLabel,
    personalEthnicityLabel,
    personalLanguagesLabel,
    personalYearsOfExperienceLabel,
    contactEmailLabel,
    contactPhoneLabel,
    contactWhatsappLabel,
    driverRecNumberLabel,
    driverRecIdLabel,
    driverNetworkNumberLabel,
    driverTypeLabel,
    driverAvailabilityLabel,
    driverGradeLabel,
    driverCurrentStatusLabel,
    driverRideStatusLabel,
    statusOnlineLabel,
    statusOfflineLabel,
    activityTotalRidesLabel,
    activityLastActiveLabel,
    activityLastSignInLabel,
    paymentCommissionLabel,
    paymentHourlyRateLabel,
    paymentDistanceRateLabel,
    paymentCycleLabel,
    paymentDayLabel,
    paymentBankNameLabel,
    paymentAccountNameLabel,
    paymentAccountNumberLabel,
    actionEditPortal,
    noteEditInfo,
    driverWebAppProdUrl,
  } = useMemo(() => {
    const get = getContent;
    return {
      headerTitle: get(PROFILE_CONTENT_KEYS.HEADER_TITLE),
      nameFallback: get(PROFILE_CONTENT_KEYS.NAME_FALLBACK),
      valueNa: get(PROFILE_CONTENT_KEYS.VALUE_NA),
      sectionPersonalLabel: get(PROFILE_CONTENT_KEYS.SECTION_PERSONAL),
      sectionContactLabel: get(PROFILE_CONTENT_KEYS.SECTION_CONTACT),
      sectionDriverDetailsLabel: get(
        PROFILE_CONTENT_KEYS.SECTION_DRIVER_DETAILS,
      ),
      sectionActivityLabel: get(PROFILE_CONTENT_KEYS.SECTION_ACTIVITY),
      sectionPaymentLabel: get(PROFILE_CONTENT_KEYS.SECTION_PAYMENT),
      personalFullNameLabel: get(PROFILE_CONTENT_KEYS.PERSONAL_FULL_NAME),
      personalDateOfBirthLabel: get(
        PROFILE_CONTENT_KEYS.PERSONAL_DATE_OF_BIRTH,
      ),
      personalGenderLabel: get(PROFILE_CONTENT_KEYS.PERSONAL_GENDER),
      personalEthnicityLabel: get(PROFILE_CONTENT_KEYS.PERSONAL_ETHNICITY),
      personalLanguagesLabel: get(PROFILE_CONTENT_KEYS.PERSONAL_LANGUAGES),
      personalYearsOfExperienceLabel: get(
        PROFILE_CONTENT_KEYS.PERSONAL_YEARS_OF_EXPERIENCE,
      ),
      contactEmailLabel: get(PROFILE_CONTENT_KEYS.CONTACT_EMAIL),
      contactPhoneLabel: get(PROFILE_CONTENT_KEYS.CONTACT_PHONE),
      contactWhatsappLabel: get(PROFILE_CONTENT_KEYS.CONTACT_WHATSAPP),
      driverRecNumberLabel: get(PROFILE_CONTENT_KEYS.DRIVER_NUMBER),
      driverRecIdLabel: get(PROFILE_CONTENT_KEYS.DRIVER_ID),
      driverNetworkNumberLabel: get(PROFILE_CONTENT_KEYS.DRIVER_NETWORK_NUMBER),
      driverTypeLabel: get(PROFILE_CONTENT_KEYS.DRIVER_TYPE),
      driverAvailabilityLabel: get(PROFILE_CONTENT_KEYS.DRIVER_AVAILABILITY),
      driverGradeLabel: get(PROFILE_CONTENT_KEYS.DRIVER_GRADE),
      driverCurrentStatusLabel: get(PROFILE_CONTENT_KEYS.DRIVER_CURRENT_STATUS),
      driverRideStatusLabel: get(PROFILE_CONTENT_KEYS.DRIVER_RIDE_STATUS),
      statusOnlineLabel: get(PROFILE_CONTENT_KEYS.STATUS_ONLINE),
      statusOfflineLabel: get(PROFILE_CONTENT_KEYS.STATUS_OFFLINE),
      activityTotalRidesLabel: get(PROFILE_CONTENT_KEYS.ACTIVITY_TOTAL_RIDES),
      activityLastActiveLabel: get(PROFILE_CONTENT_KEYS.ACTIVITY_LAST_ACTIVE),
      activityLastSignInLabel: get(PROFILE_CONTENT_KEYS.ACTIVITY_LAST_SIGN_IN),
      paymentCommissionLabel: get(PROFILE_CONTENT_KEYS.PAYMENT_COMMISSION),
      paymentHourlyRateLabel: get(PROFILE_CONTENT_KEYS.PAYMENT_HOURLY_RATE),
      paymentDistanceRateLabel: get(PROFILE_CONTENT_KEYS.PAYMENT_DISTANCE_RATE),
      paymentCycleLabel: get(PROFILE_CONTENT_KEYS.PAYMENT_CYCLE),
      paymentDayLabel: get(PROFILE_CONTENT_KEYS.PAYMENT_DAY),
      paymentBankNameLabel: get(PROFILE_CONTENT_KEYS.PAYMENT_BANK_NAME),
      paymentAccountNameLabel: get(PROFILE_CONTENT_KEYS.PAYMENT_ACCOUNT_NAME),
      paymentAccountNumberLabel: get(
        PROFILE_CONTENT_KEYS.PAYMENT_ACCOUNT_NUMBER,
      ),
      actionEditPortal: get(PROFILE_CONTENT_KEYS.ACTION_EDIT_PORTAL),
      noteEditInfo: get(PROFILE_CONTENT_KEYS.NOTE_EDIT_INFO),
      driverWebAppProdUrl: get(
        SYSTEM_SETTINGS_KEYS.DRIVER_WEB_APP_PRODUCTION_URL,
      ),
    };
  }, [getContent]);

  const router = useRouter();
  const [auth] = useAuth();
  const [driver] = useDriver();

  // Helper: show value from login user or "Not available"
  const fromUser = (value: string | number | undefined | null) =>
    value !== undefined && value !== null && String(value).trim() !== ""
      ? String(value)
      : valueNa;

  // Extract driver information from auth user (flat login API response shape)
  const user = auth?.user as any;

  // Personal Information (from flat user: first_name, last_name, years_of_experience only)
  const firstName = user?.first_name ?? "";
  const lastName = user?.last_name ?? "";
  const fullName = `${firstName} ${lastName}`.trim() || nameFallback;
  const dateOfBirth = valueNa; // not in login response
  const gender = valueNa;
  const ethnicity = valueNa;
  const languages = valueNa;
  const yearsOfExperience = fromUser(user?.years_of_experience);

  // Contact Information (flat: primary_email_address, primary_phone_number, whatsapp_contact_number)
  const email = fromUser(user?.primary_email_address);
  const phone = fromUser(user?.primary_phone_number);
  const whatsapp = fromUser(user?.whatsapp_contact_number);

  // Driver Details (flat: driver_id, driver_rec_id, driver_type, availability, active_status)
  const driverNumber = fromUser(user?.driver_id);
  const driverRecId = fromUser(user?.driver_rec_id ?? user?.id);
  const driverNetworkNumber = valueNa; // not in login response
  const driverType = fromUser(user?.driver_type);
  const availability = fromUser(user?.availability);
  const grade = valueNa;
  const currentRideStatus = valueNa;
  const isOnline =
    user?.is_online === "YES" ||
    user?.is_online === true ||
    driver?.online === true ||
    false;

  // Activity (not in login response)
  const numberOfRides = valueNa;
  const lastActiveAt = valueNa;
  const lastSignInAt = valueNa;

  // Payment Information (not in login response)
  const commissionPercentage = valueNa;
  const hourlyRate = valueNa;
  const distanceRate = valueNa;
  const paymentCycle = valueNa;
  const paymentDay = valueNa;
  const bankName = valueNa;
  const bankAccountName = valueNa;
  const bankAccountNumber = valueNa;

  // Format dates for display
  const formatDate = (dateStr: string) => {
    if (!dateStr || dateStr === valueNa || dateStr.includes("0000-00-00"))
      return valueNa;
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  // Personal Information Section
  const personalInfoItems: InfoTableDataItem[] = useMemo(
    () => [
      { label: personalFullNameLabel, value: fullName },
      { label: personalDateOfBirthLabel, value: formatDate(dateOfBirth) },
      { label: personalGenderLabel, value: gender },
      { label: personalEthnicityLabel, value: ethnicity },
      { label: personalLanguagesLabel, value: languages },
      {
        label: personalYearsOfExperienceLabel,
        value: String(yearsOfExperience),
      },
    ],
    [fullName, dateOfBirth, gender, ethnicity, languages, yearsOfExperience],
  );

  // Contact Information Section
  const contactInfoItems: InfoTableDataItem[] = useMemo(
    () => [
      { label: contactEmailLabel, value: email },
      { label: contactPhoneLabel, value: phone },
      { label: contactWhatsappLabel, value: whatsapp },
    ],
    [email, phone, whatsapp],
  );

  // Driver Details Section
  const driverDetailsItems: InfoTableDataItem[] = useMemo(
    () => [
      { label: driverRecNumberLabel, value: driverNumber },
      { label: driverRecIdLabel, value: String(driverRecId) },
      { label: driverNetworkNumberLabel, value: driverNetworkNumber },
      { label: driverTypeLabel, value: driverType },
      { label: driverAvailabilityLabel, value: availability },
      { label: driverGradeLabel, value: grade },
      {
        label: driverCurrentStatusLabel,
        value: isOnline ? statusOnlineLabel : statusOfflineLabel,
      },
      { label: driverRideStatusLabel, value: currentRideStatus },
    ],
    [
      driverNumber,
      driverRecId,
      driverNetworkNumber,
      driverType,
      availability,
      grade,
      isOnline,
      currentRideStatus,
    ],
  );

  // Activity Section
  const activityItems: InfoTableDataItem[] = useMemo(
    () => [
      {
        label: activityTotalRidesLabel,
        value:
          typeof numberOfRides === "number"
            ? String(numberOfRides)
            : numberOfRides,
      },
      { label: activityLastActiveLabel, value: formatDate(lastActiveAt) },
      { label: activityLastSignInLabel, value: formatDate(lastSignInAt) },
    ],
    [numberOfRides, lastActiveAt, lastSignInAt],
  );

  // Payment Information Section
  const paymentInfoItems: InfoTableDataItem[] = useMemo(
    () => [
      {
        label: paymentCommissionLabel,
        value:
          commissionPercentage !== valueNa
            ? `${commissionPercentage}%`
            : valueNa,
      },
      {
        label: paymentHourlyRateLabel,
        value: hourlyRate !== valueNa ? `$${hourlyRate}` : valueNa,
      },
      {
        label: paymentDistanceRateLabel,
        value: distanceRate !== valueNa ? `$${distanceRate}` : valueNa,
      },
      { label: paymentCycleLabel, value: paymentCycle },
      {
        label: paymentDayLabel,
        value: paymentDay !== valueNa ? String(paymentDay) : valueNa,
      },
      { label: paymentBankNameLabel, value: bankName },
      { label: paymentAccountNameLabel, value: bankAccountName },
      {
        label: paymentAccountNumberLabel,
        value:
          bankAccountNumber !== valueNa
            ? `****${String(bankAccountNumber).slice(-4)}`
            : valueNa,
      },
    ],
    [
      commissionPercentage,
      hourlyRate,
      distanceRate,
      paymentCycle,
      paymentDay,
      bankName,
      bankAccountName,
      bankAccountNumber,
    ],
  );

  const handleEditProfile = () => {
    const base = (driverWebAppProdUrl || "").replace(/\/$/, "");
    const url = base
      ? `${base}/profile?token=${auth?.token ?? ""}`
      : undefined;
    if (!url) return;
    router.push({
      pathname: "/(screens)/in-app-webview",
      params: {
        url,
        title: actionEditPortal,
      },
    });
  };

  const handleBackPress = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/more");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <Header
        title={headerTitle}
        hideBackIcon={false}
        onBackPress={handleBackPress}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo Section */}
        <View style={styles.logoContainer}>
          <Logo size="Large" />
        </View>

        {/* Personal Information */}
        <InfoTable
          title={sectionPersonalLabel}
          data={personalInfoItems}
          showFooter={false}
        />

        {/* Contact Information */}
        <InfoTable
          title={sectionContactLabel}
          data={contactInfoItems}
          showFooter={false}
        />

        {/* Driver Details */}
        <InfoTable
          title={sectionDriverDetailsLabel}
          data={driverDetailsItems}
          showFooter={false}
        />

        {/* Activity */}
        {/* <InfoTable
          title={sectionActivityLabel}
          data={activityItems}
          showFooter={false}
        /> */}

        {/* Payment Information */}
        {/* <InfoTable
          title={sectionPaymentLabel}
          data={paymentInfoItems}
          showFooter={false}
        /> */}

        {/* Edit Profile Button */}
        <View style={styles.buttonContainer}>
          <Button
            variant="primary"
            rounded="half"
            onPress={handleEditProfile}
            style={styles.editButton}
          >
            {actionEditPortal}
          </Button>
        </View>

        {/* Info Note */}
        <View style={styles.noteContainer}>
          <Typography type="bodySmall" weight="regular" style={styles.noteText}>
            {noteEditInfo}
          </Typography>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: textColors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingTop: 24,
    paddingBottom: 32,
    gap: 16,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  buttonContainer: {
    marginTop: 24,
    marginBottom: 16,
  },
  editButton: {
    width: "100%",
  },
  noteContainer: {
    backgroundColor: textColors.grey100,
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
  },
  noteText: {
    color: textColors.grey700,
    textAlign: "center",
    lineHeight: 20,
  },
});
