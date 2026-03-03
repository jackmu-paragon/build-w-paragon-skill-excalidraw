import React from "react";

import { MIME_TYPES } from "@excalidraw/common";
import { CaptureUpdateAction } from "@excalidraw/element";
import { paragon } from "@useparagon/connect";

import { useTunnels } from "../../context/tunnels";
import { loadFromBlob } from "../../data";
import { useAtom } from "../../editor-jotai";
import { useApp } from "../App";
import { Dialog } from "../Dialog";
import { FilledButton } from "../FilledButton";
import { withInternalFallback } from "../hoc/withInternalFallback";
import { alertTriangleIcon } from "../icons";

import { Actions, Action } from "./OverwriteConfirmActions";
import { overwriteConfirmStateAtom } from "./OverwriteConfirmState";

import "./OverwriteConfirm.scss";

export type OverwriteConfirmDialogProps = {
  children: React.ReactNode;
};

export type GoogleDriveFiles = {
  docs: {
    id: string;
    mimeType: string;
    name: string;
  }[];
};

const OverwriteConfirmDialog = Object.assign(
  withInternalFallback(
    "OverwriteConfirmDialog",
    ({ children }: OverwriteConfirmDialogProps) => {
      const { OverwriteConfirmDialogTunnel } = useTunnels();
      const [overwriteConfirmState, setState] = useAtom(
        overwriteConfirmStateAtom,
      );
      const app = useApp();

      // Paragon state
      const [isParagonReady, setIsParagonReady] = React.useState(false);
      const [isGoogleDriveConnected, setIsGoogleDriveConnected] =
        React.useState(false);
      const [isLoading, setIsLoading] = React.useState(false);
      const [isPickerReady, setIsPickerReady] = React.useState(false);
      const pickerRef = React.useRef<any>(null);

      // Refs for callbacks to avoid stale closures
      const overwriteConfirmStateRef = React.useRef(overwriteConfirmState);
      overwriteConfirmStateRef.current = overwriteConfirmState;

      // Initialize the file picker
      const initializePicker = React.useCallback(async () => {
        if (pickerRef.current) {
          return; // Already initialized
        }

        const developerKey = import.meta.env.VITE_GOOGLE_DEVELOPER_KEY;
        if (!developerKey) {
          console.warn("VITE_GOOGLE_DEVELOPER_KEY not set");
          return;
        }

        const picker = new paragon.ExternalFilePicker("googledrive", {
          allowedTypes: [MIME_TYPES.excalidraw],
          allowMultiSelect: false,
          async onFileSelect(driveFiles: unknown) {
            const files = driveFiles as GoogleDriveFiles;
            if (!files.docs || files.docs.length === 0) {
              return;
            }

            setIsLoading(true);
            try {
              const file = files.docs[0];

              const projectId = import.meta.env.VITE_PARAGON_PROJECT_ID;
              const paragonToken = import.meta.env.VITE_PARAGON_TOKEN;

              const response = await fetch(
                `https://actionkit.useparagon.com/projects/${projectId}/actions`,
                {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${paragonToken}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    action: "GOOGLE_DRIVE_DOWNLOAD_FILE",
                    parameters: {
                      fileId: file.id,
                      mimeType: file.mimeType,
                      fileEncoding: "raw",
                    },
                  }),
                },
              );

              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                  errorData.message || "Failed to download from Google Drive",
                );
              }

              const result = await response.json();
              const blob = new Blob([JSON.stringify(result)], {
                type: file.mimeType,
              });
              const data = await loadFromBlob(blob, null, null);

              // Success - update scene with loaded elements and appState
              app.syncActionResult({
                elements: data.elements,
                appState: data.appState,
                files: data.files,
                captureUpdate: CaptureUpdateAction.IMMEDIATELY,
              });

              // Close dialog
              const currentState = overwriteConfirmStateRef.current;
              if (currentState.active) {
                currentState.onClose();
              }
              setState((state) => ({ ...state, active: false }));
            } catch (error: any) {
              console.error("Failed to load file from Google Drive:", error);
              // Follow existing error pattern - reject and close
              const currentState = overwriteConfirmStateRef.current;
              if (currentState.active) {
                currentState.onReject();
              }
              setState((state) => ({ ...state, active: false }));
            } finally {
              setIsLoading(false);
            }
          },
        });

        await picker.init({
          developerKey,
        });

        pickerRef.current = picker;
        setIsPickerReady(true);
      }, [app, setState]);

      // Initialize Paragon SDK
      React.useEffect(() => {
        const initParagon = async () => {
          const projectId = import.meta.env.VITE_PARAGON_PROJECT_ID;
          const paragonToken = import.meta.env.VITE_PARAGON_TOKEN;

          if (!projectId || !paragonToken) {
            console.warn(
              "VITE_PARAGON_PROJECT_ID or VITE_PARAGON_TOKEN not set",
            );
            return;
          }

          try {
            await paragon.authenticate(projectId, paragonToken);
            setIsParagonReady(true);

            // Check if Google Drive is connected
            const user = paragon.getUser();
            if (user?.authenticated) {
              const integrations = user.integrations || {};
              const googleDrive = integrations.googledrive;
              const isConnected = googleDrive?.enabled === true;
              setIsGoogleDriveConnected(isConnected);
            }
          } catch (error) {
            console.error("Failed to initialize Paragon:", error);
          }
        };

        initParagon();
      }, []);

      // Initialize picker when Google Drive is connected
      React.useEffect(() => {
        if (isGoogleDriveConnected && !pickerRef.current) {
          initializePicker();
        }
      }, [isGoogleDriveConnected, initializePicker]);

      if (!overwriteConfirmState.active) {
        return null;
      }

      const handleClose = () => {
        overwriteConfirmState.onClose();
        setState((state) => ({ ...state, active: false }));
      };

      const handleConfirm = () => {
        overwriteConfirmState.onConfirm();
        setState((state) => ({ ...state, active: false }));
      };

      const handleLoadFromGoogleDrive = async () => {
        if (!isParagonReady) {
          return;
        }

        if (!isGoogleDriveConnected) {
          paragon.connect("googledrive", {
            onSuccess: async () => {
              setIsGoogleDriveConnected(true);
              // Initialize picker after successful connection
              await initializePicker();
            },
            onError: (error: Error) => {
              console.error("Failed to connect Google Drive:", error);
            },
          });
          return;
        }

        // Open the picker if it's ready
        if (isPickerReady && pickerRef.current) {
          pickerRef.current.open();
        }
      };

      return (
        <OverwriteConfirmDialogTunnel.In>
          <Dialog onCloseRequest={handleClose} title={false} size={916}>
            <div className="OverwriteConfirm">
              <h3>{overwriteConfirmState.title}</h3>
              <div
                className={`OverwriteConfirm__Description OverwriteConfirm__Description--color-${overwriteConfirmState.color}`}
              >
                <div className="OverwriteConfirm__Description__icon">
                  {alertTriangleIcon}
                </div>
                <div>{overwriteConfirmState.description}</div>
                <div className="OverwriteConfirm__Description__spacer"></div>
                <div className="OverwriteConfirm__Button__container">
                  <FilledButton
                    color={overwriteConfirmState.color}
                    size="large"
                    label={overwriteConfirmState.actionLabel}
                    onClick={handleConfirm}
                  />
                  <FilledButton
                    variant="filled"
                    color="primary"
                    size="large"
                    label={
                      isLoading
                        ? "Loading..."
                        : isGoogleDriveConnected
                          ? "Load from Google Drive"
                          : "Connect Google Drive"
                    }
                    onClick={handleLoadFromGoogleDrive}
                    disabled={
                      !isParagonReady ||
                      isLoading ||
                      (isGoogleDriveConnected && !isPickerReady)
                    }
                  />
                </div>
              </div>
              <Actions>{children}</Actions>
            </div>
          </Dialog>
        </OverwriteConfirmDialogTunnel.In>
      );
    },
  ),
  {
    Actions,
    Action,
  },
);

export { OverwriteConfirmDialog };
