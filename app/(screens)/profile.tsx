import Button from "@/components/Button";
import Header from "@/components/Header";
import InfoTable, { InfoTableDataItem } from "@/components/InfoTable";
import Logo from "@/components/Logo";
import Typography from "@/components/Typography";
import { textColors } from "@/constants/colors";
import { URLS } from "@/constants/global";
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
    };
  }, [getContent]);

  const router = useRouter();
  const [auth] = useAuth();
  const [driver] = useDriver();

  // Extract driver information from auth user object (contains full driver data from login)
  const user = auth?.user as any;
  const personalInfo = user?.personal_information || {};
  const contactInfo = user?.contact_information || {};
  const paymentInfo = user?.payment_and_compensation || {};
  const activity = user?.activity || {};

  // Personal Information
  const firstName = personalInfo?.first_name || "";
  const lastName = personalInfo?.last_name || "";
  const fullName = `${firstName} ${lastName}`.trim() || nameFallback;
  const dateOfBirth = personalInfo?.date_of_birth || valueNa;
  const gender = personalInfo?.gender || valueNa;
  const ethnicity = personalInfo?.ethnicity || valueNa;
  const languages = personalInfo?.driver_language || valueNa;
  const ssn = personalInfo?.social_security_number || valueNa;
  const yearsOfExperience = user?.years_of_experience || valueNa;

  // Contact Information
  const email = contactInfo?.primary_email_address || valueNa;
  const phone = contactInfo?.primary_phone_number || valueNa;
  const whatsapp = contactInfo?.whatsapp_contact_number || valueNa;

  // Driver Details
  const driverNumber = user?.driver_number || valueNa;
  const driverRecId = user?.driver_rec_id || user?.id || valueNa;
  const driverNetworkNumber = user?.driver_network_number || valueNa;
  const driverType = user?.driver_type || valueNa;
  const availability = user?.availability || valueNa;
  const grade = user?.grade || valueNa;
  const currentRideStatus = user?.current_ride_status || valueNa;
  const isOnline =
    user?.is_online === "YES" ||
    user?.is_online === true ||
    driver?.online ||
    false;

  // Activity
  const numberOfRides = activity?.number_of_rides || 0;
  const lastActiveAt = activity?.last_active_at || valueNa;
  const lastSignInAt = activity?.last_sign_in_at || valueNa;

  // Payment Information
  const commissionPercentage = paymentInfo?.commission_percentage || valueNa;
  const hourlyRate = paymentInfo?.hourly_rate || valueNa;
  const distanceRate = paymentInfo?.distance_rate || valueNa;
  const paymentCycle = paymentInfo?.payment_cycle || valueNa;
  const paymentDay = paymentInfo?.payment_day || valueNa;
  const bankName = paymentInfo?.payment_bank_name || valueNa;
  const bankAccountName = paymentInfo?.payment_bank_account_name || valueNa;
  const bankAccountNumber = paymentInfo?.payment_bank_account_number || valueNa;

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
      { label: activityTotalRidesLabel, value: String(numberOfRides) },
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
    router.push({
      pathname: "/(screens)/in-app-webview",
      params: {
        url: URLS.driverPortal,
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
        <InfoTable
          title={sectionActivityLabel}
          data={activityItems}
          showFooter={false}
        />

        {/* Payment Information */}
        <InfoTable
          title={sectionPaymentLabel}
          data={paymentInfoItems}
          showFooter={false}
        />

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
