import React from "react";

import { DEFAULT_FILENAME, getFrame, MIME_TYPES } from "@excalidraw/common";
import { paragon } from "@useparagon/connect";

import type { NonDeletedExcalidrawElement } from "@excalidraw/element/types";

import { actionSaveFileToDisk } from "../actions/actionExport";

import { trackEvent } from "../analytics";
import { nativeFileSystemSupported } from "../data/filesystem";
import { serializeAsJSON } from "../data/json";
import { t } from "../i18n";

import { Card } from "./Card";
import { Dialog } from "./Dialog";
import { ToolButton } from "./ToolButton";
import { exportToFileIcon, GoogleDriveIcon, LinkIcon } from "./icons";

import "./ExportDialog.scss";

import type { ActionManager } from "../actions/manager";

import type { ExportOpts, BinaryFiles, UIAppState } from "../types";

const stringToHex = (str: string): string => {
  return Array.from(new TextEncoder().encode(str))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

export type ExportCB = (
  elements: readonly NonDeletedExcalidrawElement[],
  scale?: number,
) => void;

const JSONExportModal = ({
  elements,
  appState,
  setAppState,
  files,
  actionManager,
  exportOpts,
  canvas,
  onCloseRequest,
}: {
  appState: UIAppState;
  setAppState: React.Component<any, UIAppState>["setState"];
  files: BinaryFiles;
  elements: readonly NonDeletedExcalidrawElement[];
  actionManager: ActionManager;
  onCloseRequest: () => void;
  exportOpts: ExportOpts;
  canvas: HTMLCanvasElement;
}) => {
  const [isParagonReady, setIsParagonReady] = React.useState(false);
  const [isGoogleDriveConnected, setIsGoogleDriveConnected] =
    React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  // Initialize Paragon SDK
  React.useEffect(() => {
    const initParagon = async () => {
      const projectId = import.meta.env.VITE_PARAGON_PROJECT_ID;
      const paragonToken = import.meta.env.VITE_PARAGON_TOKEN;

      if (!projectId) {
        console.warn("VITE_PARAGON_PROJECT_ID not set");
        return;
      }

      if (!paragonToken) {
        console.warn("VITE_PARAGON_TOKEN not set");
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
          setIsGoogleDriveConnected(googleDrive?.enabled === true);
        }
      } catch (error) {
        console.error("Failed to initialize Paragon:", error);
      }
    };

    initParagon();
  }, []);

  const handleGoogleDriveClick = async () => {
    if (!isParagonReady) {
      console.warn("Paragon not ready yet");
      return;
    }

    if (isGoogleDriveConnected) {
      setIsSaving(true);
      try {
        trackEvent("export", "googledrive", `ui (${getFrame()})`);

        const projectId = import.meta.env.VITE_PARAGON_PROJECT_ID;
        const paragonToken = import.meta.env.VITE_PARAGON_TOKEN;
        const filename = `${appState.name || DEFAULT_FILENAME}.excalidraw`;

        // Serialize the drawing data
        const serialized = serializeAsJSON(elements, appState, files, "local");
        const hexData = stringToHex(serialized);

        // Call ActionKit to save to Google Drive
        const response = await fetch(
          `https://actionkit.useparagon.com/projects/${projectId}/actions`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${paragonToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              action: "GOOGLE_DRIVE_SAVE_FILE",
              parameters: {
                filename,
                file: {
                  data: hexData,
                  dataType: "FILE",
                  mimeType: MIME_TYPES.excalidraw,
                },
              },
            }),
          },
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || "Failed to save to Google Drive",
          );
        }

        // Success: close dialog and show toast (matching actionSaveFileToDisk pattern)
        setAppState({
          openDialog: null,
          toast: { message: t("toast.fileSaved") },
        });
      } catch (error: any) {
        console.error("Failed to save to Google Drive:", error);
        setAppState({ errorMessage: error.message });
      } finally {
        setIsSaving(false);
      }
    } else {
      paragon.connect("googledrive", {
        onSuccess: () => {
          setIsGoogleDriveConnected(true);
        },
        onError: (error: Error) => {
          console.error("Failed to connect Google Drive:", error);
          setAppState({ errorMessage: error.message });
        },
      });
    }
  };

  const { onExportToBackend } = exportOpts;
  return (
    <div className="ExportDialog ExportDialog--json">
      <div className="ExportDialog-cards">
        {exportOpts.saveFileToDisk && (
          <Card color="lime">
            <div className="Card-icon">{exportToFileIcon}</div>
            <h2>{t("exportDialog.disk_title")}</h2>
            <div className="Card-details">
              {t("exportDialog.disk_details")}
              {!nativeFileSystemSupported &&
                actionManager.renderAction("changeProjectName")}
            </div>
            <ToolButton
              className="Card-button"
              type="button"
              title={t("exportDialog.disk_button")}
              aria-label={t("exportDialog.disk_button")}
              showAriaLabel={true}
              onClick={() => {
                actionManager.executeAction(actionSaveFileToDisk, "ui");
              }}
            />
          </Card>
        )}
        {onExportToBackend && (
          <Card color="pink">
            <div className="Card-icon">{LinkIcon}</div>
            <h2>{t("exportDialog.link_title")}</h2>
            <div className="Card-details">{t("exportDialog.link_details")}</div>
            <ToolButton
              className="Card-button"
              type="button"
              title={t("exportDialog.link_button")}
              aria-label={t("exportDialog.link_button")}
              showAriaLabel={true}
              onClick={async () => {
                try {
                  trackEvent("export", "link", `ui (${getFrame()})`);
                  await onExportToBackend(elements, appState, files);
                  onCloseRequest();
                } catch (error: any) {
                  setAppState({ errorMessage: error.message });
                }
              }}
            />
          </Card>
        )}
        <Card color="blue">
          <div className="Card-icon">{GoogleDriveIcon}</div>
          <h2>Google Drive</h2>
          <div className="Card-details">
            {isGoogleDriveConnected
              ? "Save your drawing to Google Drive"
              : "Connect to Google Drive to save your drawings"}
            {!nativeFileSystemSupported &&
              actionManager.renderAction("changeProjectName")}
          </div>
          <ToolButton
            className="Card-button"
            type="button"
            title={
              isSaving
                ? "Saving..."
                : isGoogleDriveConnected
                  ? "Save to Drive"
                  : "Connect Google Drive"
            }
            aria-label={
              isGoogleDriveConnected ? "Save to Drive" : "Connect Google Drive"
            }
            showAriaLabel={true}
            onClick={handleGoogleDriveClick}
            disabled={isSaving}
          />
        </Card>
      </div>
    </div>
  );
};

export const JSONExportDialog = ({
  elements,
  appState,
  files,
  actionManager,
  exportOpts,
  canvas,
  setAppState,
}: {
  elements: readonly NonDeletedExcalidrawElement[];
  appState: UIAppState;
  files: BinaryFiles;
  actionManager: ActionManager;
  exportOpts: ExportOpts;
  canvas: HTMLCanvasElement;
  setAppState: React.Component<any, UIAppState>["setState"];
}) => {
  const handleClose = React.useCallback(() => {
    setAppState({ openDialog: null });
  }, [setAppState]);

  return (
    <>
      {appState.openDialog?.name === "jsonExport" && (
        <Dialog onCloseRequest={handleClose} title={t("buttons.export")}>
          <JSONExportModal
            elements={elements}
            appState={appState}
            setAppState={setAppState}
            files={files}
            actionManager={actionManager}
            onCloseRequest={handleClose}
            exportOpts={exportOpts}
            canvas={canvas}
          />
        </Dialog>
      )}
    </>
  );
};
