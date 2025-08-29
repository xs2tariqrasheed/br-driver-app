import Typography from "@/components/Typography";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { StyleSheet, View } from "react-native";

import AccordionExamples from "@/components/Accordion/examples";
import Button, { IconButton, SwipeableButton } from "@/components/Button";
import Input from "@/components/Form/Input";
import PasswordRequirements from "@/components/Form/Password/Requirements";
import PasswordStrength from "@/components/Form/Password/Strength";
import Toggle from "@/components/Form/Toggle";
import Loader from "@/components/Loader";
import { showToast } from "@/components/Toast";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { textColors } from "@/constants/colors";
import { useDelete } from "@/hooks/useDelete";
import { useFetch } from "@/hooks/useFetch";
import { useGetById } from "@/hooks/useGetById";
import { usePost } from "@/hooks/usePost";
import { logger } from "@/utils/helpers";
import Logo from "./Logo";

type Todo = {
  userId: number;
  id: number;
  title: string;
  completed: boolean;
};

const TODOS_BASE = "https://jsonplaceholder.typicode.com/todos";

export default function Examples() {
  const [newTitle, setNewTitle] = useState("");
  const [lookupId, setLookupId] = useState("");
  const [displayedTodos, setDisplayedTodos] = useState<Todo[]>([]);

  // Local demo state moved from HomeScreen
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

  // Logger function
  const log = logger();

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
    log("Form submitted", data);
  };

  const {
    data: todos,
    loading: loadingTodos,
    error: listError,
    execute: fetchTodos,
  } = useFetch<Todo[]>(TODOS_BASE);

  const {
    data: createdTodo,
    loading: creating,
    error: createError,
    execute: createTodo,
  } = usePost<Todo, Partial<Todo>>(TODOS_BASE);

  const {
    data: todoById,
    loading: loadingById,
    error: byIdError,
    execute: getTodoById,
  } = useGetById<Todo>(TODOS_BASE);

  const {
    success: deleteSuccess,
    loading: deleting,
    error: deleteError,
    execute: deleteTodo,
  } = useDelete(TODOS_BASE);

  const limitedTodos = useMemo(() => todos?.slice(0, 10) ?? [], [todos]);

  // Keep local displayed list in sync with fetched results
  useEffect(() => {
    setDisplayedTodos(limitedTodos);
  }, [limitedTodos]);

  useEffect(() => {
    fetchTodos({ _limit: 10 }).catch(() => {});
  }, [fetchTodos]);

  useEffect(() => {
    if (createError) {
      showToast(createError, { variant: "error", position: "top" });
    }
  }, [createError]);

  useEffect(() => {
    if (listError) {
      showToast(listError, { variant: "error", position: "top" });
    }
  }, [listError]);

  useEffect(() => {
    if (byIdError) {
      showToast(byIdError, { variant: "error", position: "top" });
    }
  }, [byIdError]);

  useEffect(() => {
    if (deleteError) {
      showToast(deleteError, { variant: "error", position: "top" });
    }
  }, [deleteError]);

  const handleCreate = async () => {
    const title = newTitle.trim() || "New Todo";
    try {
      const created = await createTodo({ title, completed: false, userId: 1 });
      showToast("Created todo (mock)", { variant: "success", position: "top" });
      setNewTitle("");
      // Optimistically add to local list (JSONPlaceholder won't persist)
      setDisplayedTodos((prev) => [created, ...prev]);
    } catch {}
  };

  const handleLookup = async () => {
    const idNum = Number(lookupId);
    if (!lookupId || Number.isNaN(idNum)) {
      showToast("Enter a valid numeric ID", {
        variant: "warning",
        position: "bottom",
      });
      return;
    }
    try {
      await getTodoById(idNum);
    } catch {}
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteTodo(id);
      showToast("Deleted todo (mock)", { variant: "success", position: "top" });
      // Optimistically remove from local list
      setDisplayedTodos((prev) => prev.filter((t) => t.id !== id));
    } catch {}
  };

  return (
    <View style={styles.container}>
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
      {/* Loader size examples */}
      <View
        style={{
          flexDirection: "row",
          gap: 24,
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <View style={{ alignItems: "center" }}>
          <Loader size="small" />
          <Typography
            type="labelLarge"
            weight="regular"
            style={{ color: "#6b7280", marginTop: 6 }}
          >
            Small
          </Typography>
        </View>
        <View style={{ alignItems: "center" }}>
          <Loader size="medium" />
          <Typography
            type="labelLarge"
            weight="regular"
            style={{ color: "#6b7280", marginTop: 6 }}
          >
            Medium
          </Typography>
        </View>
        <View style={{ alignItems: "center" }}>
          <Loader size="large" />
          <Typography
            type="labelLarge"
            weight="regular"
            style={{ color: "#6b7280", marginTop: 6 }}
          >
            Large
          </Typography>
        </View>
      </View>
      {/* Accordion examples (moved from HomeScreen) */}
      <AccordionExamples />

      <Typography type="headingSmall" weight="semibold" style={styles.textBase}>
        Hooks Demo (JSONPlaceholder Todos)
      </Typography>

      {/* Create Todo */}
      <View style={styles.row}>
        <Input
          label="New Todo Title"
          placeholder="Buy milk"
          value={newTitle}
          onChangeText={setNewTitle}
          style={{ flex: 1 }}
        />
        <Button
          onPress={handleCreate}
          disabled={creating}
          style={styles.button}
          variant="primary"
          rounded="half"
          block="half"
        >
          {creating ? "Creating..." : "Create"}
        </Button>
      </View>

      {/* Lookup by ID */}
      <View style={styles.row}>
        <Input
          label="Lookup ID"
          placeholder="e.g. 1"
          value={lookupId}
          onChangeText={setLookupId}
          inputType="number"
          style={{ flex: 1 }}
        />
        <Button
          onPress={handleLookup}
          disabled={loadingById}
          style={styles.button}
          variant="primary"
          rounded="half"
          block="half"
        >
          {loadingById ? "Fetching..." : "Get by ID"}
        </Button>
      </View>

      {todoById ? (
        <View style={styles.card}>
          <Typography
            type="bodyLarge"
            weight="semibold"
            style={styles.textBase}
          >
            Selected Todo
          </Typography>
          <Typography type="bodyLarge" weight="regular" style={styles.textBase}>
            ID: {todoById.id}
          </Typography>
          <Typography type="bodyLarge" weight="regular" style={styles.textBase}>
            Title: {todoById.title}
          </Typography>
          <Typography type="bodyLarge" weight="regular" style={styles.textBase}>
            Status: {todoById.completed ? "Completed" : "Pending"}
          </Typography>
        </View>
      ) : null}

      <View style={{ marginVertical: 8 }}>
        <Button
          onPress={() => fetchTodos({ _limit: 10 })}
          disabled={loadingTodos}
          variant="primary"
          rounded="half"
          block
        >
          {loadingTodos ? "Loading Todos..." : "Reload Todos"}
        </Button>
      </View>

      <View style={{ gap: 8 }}>
        {displayedTodos.length === 0 && !loadingTodos ? (
          <Typography
            type="bodyMedium"
            weight="regular"
            style={{ textAlign: "center", color: "#666" }}
          >
            No todos loaded.
          </Typography>
        ) : null}
        {displayedTodos.map((item) => (
          <View key={item.id} style={styles.todoItem}>
            <View style={{ flex: 1 }}>
              <Typography
                type="bodyLarge"
                weight="medium"
                style={[styles.textBase, styles.todoTitle]}
                onPress={() => getTodoById(item.id)}
              >
                #{item.id} - {item.title}
              </Typography>
              <Typography
                type="bodyMedium"
                weight="regular"
                style={[styles.textBase, styles.todoMeta]}
              >
                {item.completed ? "Completed" : "Pending"}
              </Typography>
            </View>
            <Button
              variant="danger"
              onPress={() => handleDelete(item.id)}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </View>
        ))}
      </View>

      {/* React Hook Form + Input examples (moved from HomeScreen) */}
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

      {/* Toast demos */}
      <View style={{ flexDirection: "column", gap: 12, marginBottom: 16 }}>
        <Button
          onPress={() =>
            showToast("Success toast example", {
              variant: "success",
              position: "top",
            })
          }
        >
          Show Success Toast (Top)
        </Button>
        <Button
          onPress={() =>
            showToast(
              "Success toast example long message to see how it looks",
              {
                variant: "success",
                position: "top",
              }
            )
          }
        >
          Show Success Toast Long Message (Top)
        </Button>
        <Button
          onPress={() =>
            showToast("Warning toast example", {
              variant: "warning",
              position: "bottom",
            })
          }
        >
          Show Warning Toast (Bottom)
        </Button>
        <Button
          onPress={() =>
            showToast("Error toast example", {
              variant: "error",
              position: "top",
            })
          }
        >
          Show Error Toast (Top)
        </Button>
      </View>

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

      {/* Button variants */}
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

      {/* Icon buttons */}
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

      {/* Toggles */}
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
        value={status}
        setValue={setStatus}
        onChange={(val) => log(val)}
        size={{ width: 240, height: 48 }}
      />
      {/* labeled string toggle */}
      <Toggle
        variant="labeled"
        labels={["Offline", "Online"]}
        value={status}
        setValue={setStatus}
        onChange={(val) => log(val)}
      />

      {/* Swipeable buttons */}
      <SwipeableButton
        title="Swipe with auto reset"
        onComplete={() => log("Arrived")}
        autoReset={true}
      />
      <SwipeableButton
        title="Swipe with disabled"
        onComplete={() => log("Completed")}
        autoReset={true}
        disabled={true}
      />
      <SwipeableButton
        title="Swipe to mark as completed"
        onComplete={() => log("Arrived")}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    marginTop: 16,
    marginBottom: 24,
  },
  textBase: {
    color: "#111827",
  },
  heading: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  button: {
    alignSelf: "flex-end",
  },
  card: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#fff",
  },
  cardTitle: {
    fontWeight: "600",
    marginBottom: 4,
  },
  todoItem: {
    flexDirection: "column",
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#fff",
    color: textColors.black,
    gap: 8,
  },
  todoTitle: {
    fontSize: 14,
    fontWeight: "500",
  },
  todoMeta: {
    color: "#6b7280",
    marginTop: 2,
  },
});
