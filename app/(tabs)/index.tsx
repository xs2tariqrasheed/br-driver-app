import { Image } from "expo-image";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { StyleSheet, View } from "react-native";

import AccordionExamples from "@/components/Accordion/examples";
import Button, { IconButton, SwipeableButton } from "@/components/Button";
import Input from "@/components/Form/Input";
import PasswordRequirements from "@/components/Form/Password/Requirements";
import PasswordStrength from "@/components/Form/Password/Strength";
import Toggle from "@/components/Form/Toggle";
import Logo from "@/components/Logo";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { IconSymbol } from "@/components/ui/IconSymbol";

export default function HomeScreen() {
  const [isOn, setIsOn] = useState(false);
  const [companyId, setCompanyId] = useState("");
  const [loginId, setLoginId] = useState("");
  const [status, setStatus] = useState("Offline");

  type DemoFormValues = {
    firstName: string;
    email: string;
    password: string;
    confirmPassword: string;
    age: string;
  };

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    trigger,
  } = useForm<DemoFormValues>({
    defaultValues: {
      firstName: "",
      email: "",
      password: "",
      confirmPassword: "",
      age: "",
    },
    mode: "onChange",
  });

  const onSubmit = (data: DemoFormValues) => {
    console.log("Form submitted", data);
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor="#A1CEDC"
      headerImage={
        <Image
          source={require("@/assets/images/partial-react-logo.png")}
          style={styles.reactLogo}
        />
      }
    >
      <View
        style={{
          flexDirection: "row",
          gap: 16,
          marginBottom: 24,
          alignItems: "center",
        }}
      >
        <Logo />
        <Logo size="Medium" />
        <Logo size="Small" />
      </View>
      <AccordionExamples />

      {/* React Hook Form + Input examples */}
      <Controller
        control={control}
        name="firstName"
        rules={{ required: "This is required." }}
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="First name"
            placeholder="Enter first name"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            name="firstName"
            errors={errors}
          />
        )}
      />

      <Controller
        control={control}
        name="email"
        rules={{
          required: "Email is required.",
          pattern: {
            value: /\S+@\S+\.\S+/, // simple email check
            message: "Enter a valid email.",
          },
        }}
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Email"
            placeholder="your@email.com"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            inputType="email"
            name="email"
            errors={errors}
          />
        )}
      />

      <Controller
        control={control}
        name="password"
        rules={{
          required: "Password is required.",
          minLength: { value: 8, message: "Minimum 8 characters." },
        }}
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Password"
            placeholder="Enter password"
            value={value}
            onChangeText={(t) => {
              onChange(t);
              // ensure confirmPassword revalidates when password changes
              trigger("confirmPassword");
            }}
            onBlur={onBlur}
            inputType="password"
            name="password"
            errors={errors}
          />
        )}
      />

      {/* Password Requirements Demo (driven by current password field) */}
      <View style={{ marginTop: 8, marginBottom: 16 }}>
        <PasswordRequirements password={watch("password")} />
      </View>

      <Controller
        control={control}
        name="confirmPassword"
        rules={{
          required: "Please confirm your password.",
          validate: (val) =>
            val === watch("password") || "Passwords don’t match",
        }}
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Confirm Password"
            placeholder="Re-enter password"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            inputType="password"
            rightIcon="info"
            name="confirmPassword"
            errors={errors}
          />
        )}
      />

      <Controller
        control={control}
        name="age"
        rules={{
          required: "Age is required.",
          validate: (v) => {
            const n = Number(v);
            if (Number.isNaN(n)) return "Enter a number";
            if (n < 18) return "Must be at least 18";
            return true;
          },
        }}
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Age"
            placeholder="18"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            inputType="number"
            name="age"
            errors={errors}
          />
        )}
      />

      <Button style={{ marginBottom: 24 }} onPress={handleSubmit(onSubmit)}>
        Submit Demo Form
      </Button>
      <Input
        label="Company ID"
        placeholder="Enter your company ID"
        value={companyId}
        onChangeText={setCompanyId}
        style={{ marginBottom: 16 }}
      />
      <Input
        label="Login ID"
        placeholder="Enter your login ID"
        value={loginId}
        onChangeText={setLoginId}
        style={{ marginBottom: 24 }}
      />
      <Input
        label="Disabled"
        placeholder="Disabled"
        value={loginId}
        onChangeText={setLoginId}
        disabled
        style={{ marginBottom: 24 }}
      />
      <Input
        label="New Password"
        inputType="password"
        placeholder="New Password"
        rightIcon="info"
        onRightIconClick={() => {
          /* show tooltip */
        }}
      />
      <Input
        label="New Password with info icon"
        inputType="password"
        placeholder="New Password with info icon"
        rightIcon="info"
        onRightIconClick={() => {
          /* show tooltip */
        }}
      />

      <Button variant="primary">Primary Full</Button>
      <Button variant="primary" block="half">
        Primary Half
      </Button>
      <Button variant="outlined">Outlined Full</Button>
      <Button variant="outlined" block="half">
        Outlined Half
      </Button>
      <Button variant="danger">Danger Full</Button>
      <Button variant="danger" block="half">
        Danger Half
      </Button>
      <Button loading>Loading...</Button>
      <Button loading block="half">
        Loading Half
      </Button>
      <Button disabled>Disabled Full</Button>
      <Button disabled block="half">
        Disabled Half
      </Button>
      <Button variant="primary" rounded="full">
        Primary Rounded Full
      </Button>
      <Button variant="primary" block="half" rounded="full">
        Primary Rounded Half
      </Button>
      <Button variant="outlined" rounded="full">
        Outlined Rounded Full
      </Button>
      <Button variant="outlined" block="half" rounded="half">
        Outlined Rounded Half
      </Button>
      <Button
        variant="primary"
        rounded="full"
        icon={<IconSymbol name="chevron.right" size={20} color="white" />}
      >
        Primary With Icon
      </Button>
      <Button
        variant="outlined"
        rounded="full"
        icon={<IconSymbol name="chevron.right" size={20} color="black" />}
      >
        Outlined With Icon
      </Button>
      <Button
        variant="danger"
        rounded="full"
        icon={<IconSymbol name="chevron.left" size={20} color="white" />}
        iconPosition="left"
      >
        Danger With Left Icon
      </Button>
      <IconButton
        size={4}
        rounded={true}
        disabled={false}
        icon={<IconSymbol name="chevron.left" size={20} color="white" />}
      />
      <IconButton
        size={4}
        rounded={false}
        disabled={false}
        icon={<IconSymbol name="chevron.right" size={20} color="white" />}
      />
      <IconButton
        size={3}
        rounded={true}
        disabled={false}
        icon={<IconSymbol name="chevron.left" size={20} color="white" />}
      />
      <IconButton
        size={3}
        rounded={false}
        disabled={false}
        icon={<IconSymbol name="chevron.right" size={20} color="white" />}
      />
      <IconButton
        size={2}
        rounded={true}
        disabled={false}
        icon={<IconSymbol name="xmark" size={20} color="white" />}
      />
      <IconButton
        size={2}
        rounded={false}
        disabled={false}
        icon={<IconSymbol name="chevron.right" size={20} color="white" />}
      />
      <IconButton
        size={1}
        rounded={true}
        disabled={false}
        icon={<IconSymbol name="chevron.left" size={20} color="white" />}
      />
      <IconButton
        size={1}
        rounded={false}
        disabled={false}
        icon={<IconSymbol name="chevron.right" size={20} color="white" />}
      />
      <Toggle value={isOn} setValue={setIsOn} />
      <Toggle
        value={isOn}
        setValue={setIsOn}
        size={{ width: 100, height: 30 }}
      />
      <Toggle value={isOn} setValue={setIsOn} disabled={true} />

      {/* labeled string toggle */}
      <Toggle
        variant="labeled"
        labels={["Offline", "Online"]}
        value={status} // "Offline" | "Online"
        setValue={setStatus} // receives "Offline" or "Online"
        onChange={(val) => console.log(val)}
        size={{ width: 240, height: 48 }} // optional
      />
      {/* labeled string toggle */}
      <Toggle
        variant="labeled"
        labels={["Offline", "Online"]}
        value={status} // "Offline" | "Online"
        setValue={setStatus} // receives "Offline" or "Online"
        onChange={(val) => console.log(val)}
      />

      <SwipeableButton
        title="Swipe with auto reset"
        onComplete={() => console.log("Arrived")}
        autoReset={true}
      />
      <SwipeableButton
        title="Swipe with disabled"
        onComplete={() => console.log("Completed")}
        autoReset={true}
        disabled={true}
      />
      <SwipeableButton
        title="Swipe to mark as completed"
        onComplete={() => console.log("Arrived")}
      />
      {/* Password strength examples */}
      <View style={{ gap: 12, marginTop: 16, marginBottom: 24 }}>
        {/* Weak: fails length */}
        <PasswordStrength password="Test#1" />
        {/* Moderate: length ok + 3 classes (no special) */}
        <PasswordStrength password="Abcdef12" />
        {/* Strong: length ok + 4 classes */}
        <PasswordStrength password="Abcdef12!" />
      </View>
      {/* Password Requirements static examples */}
      <View style={{ gap: 12, marginBottom: 24 }}>
        <PasswordRequirements password="" />
        <PasswordRequirements password="Abcdef12" />
        <PasswordRequirements password="Abcdef12!" />
      </View>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
});
