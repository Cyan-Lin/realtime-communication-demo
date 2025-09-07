import { useState, useCallback } from "react";

export function useBackendDataGeneration() {
  const [isBackendDataActive, setIsBackendDataActive] = useState(false);

  const startBackendDataGeneration = useCallback(async () => {
    try {
      const response = await fetch(
        "http://localhost:8080/triggerInsertTestData",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const result = await response.text();
        console.log("Backend response:", result);
        setIsBackendDataActive(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error starting backend data generation:", error);
      setIsBackendDataActive(false);
      throw error;
    }
  }, []);

  const stopBackendDataGeneration = useCallback(async () => {
    try {
      const response = await fetch("http://localhost:8080/stopInsertTestData", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const result = await response.text();
        console.log("Backend stop response:", result);
        setIsBackendDataActive(false);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error stopping backend data generation:", error);
      setIsBackendDataActive(false);
      throw error;
    }
  }, []);

  return {
    isBackendDataActive,
    startBackendDataGeneration,
    stopBackendDataGeneration,
    setIsBackendDataActive,
  };
}
