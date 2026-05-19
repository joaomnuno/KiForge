import { useState } from "react";
import { AppScaffold } from "../../components/layout/AppScaffold";
import { Button } from "../../components/ui/Button";
import { Panel } from "../../components/ui/Panel";
import { getRuntimeLabel } from "../../lib/runtime";
import { outputTargets, voltageDomains } from "../../types/domain";
import {
  useSettingsStore,
  type ThemePreference
} from "./settings-store";

const themeOptions: readonly ThemePreference[] = ["Dark", "System", "Light"];

export function SettingsPage() {
  const settings = useSettingsStore();
  const updateSetting = useSettingsStore((state) => state.updateSetting);
  const resetSettings = useSettingsStore((state) => state.resetSettings);
  const [savedToast, setSavedToast] = useState<string | null>(null);

  function flashSaved(message: string) {
    setSavedToast(message);
    window.setTimeout(() => setSavedToast(null), 1600);
  }

  function handleReset() {
    if (!window.confirm("Reset all preferences to defaults?")) {
      return;
    }
    resetSettings();
    flashSaved("Preferences reset to defaults");
  }

  return (
    <AppScaffold
      activeNav="settings"
      searchPlaceholder="Search preferences..."
      inspector={
        <>
          <Panel
            eyebrow="About"
            title="KiForge"
            description="Tauri + React desktop workspace for hardware planning."
          >
            <dl className="fact-grid">
              <div>
                <dt>Runtime</dt>
                <dd>{getRuntimeLabel()}</dd>
              </div>
              <div>
                <dt>Version</dt>
                <dd>0.1.0</dd>
              </div>
              <div>
                <dt>Storage</dt>
                <dd>Local filesystem</dd>
              </div>
            </dl>
          </Panel>

          <Panel
            eyebrow="Account"
            title={settings.displayName}
            description={settings.email}
          >
            <p className="form-note">
              Update your display name and contact email under Account
              preferences.
            </p>
          </Panel>
        </>
      }
    >
      <div className="page-stack page-stack--narrow">
        <section className="page-hero">
          <div>
            <p className="eyebrow">Workspace preferences</p>
            <h1 className="page-title">Settings</h1>
            <p className="page-subtitle">
              Defaults that apply across every project you create on this
              machine.
            </p>
          </div>
        </section>

        {savedToast ? (
          <Panel>
            <p className="form-note">{savedToast}</p>
          </Panel>
        ) : null}

        <Panel
          eyebrow="Account"
          title="Identity"
          description="Shown in the account menu and on shared exports."
        >
          <div className="form-grid">
            <label className="field">
              <span>Display name</span>
              <input
                className="field__control"
                onChange={(event) =>
                  updateSetting("displayName", event.target.value)
                }
                type="text"
                value={settings.displayName}
              />
            </label>

            <label className="field">
              <span>Email</span>
              <input
                className="field__control"
                onChange={(event) =>
                  updateSetting("email", event.target.value)
                }
                type="email"
                value={settings.email}
              />
            </label>
          </div>
        </Panel>

        <Panel
          eyebrow="Appearance"
          title="Theme"
          description="The desktop build currently renders in dark mode; light and system modes will follow the OS palette."
        >
          <div className="button-group">
            {themeOptions.map((theme) => (
              <button
                key={theme}
                className={
                  settings.theme === theme
                    ? "filter-pill filter-pill--active"
                    : "filter-pill"
                }
                onClick={() => {
                  updateSetting("theme", theme);
                  flashSaved(`Theme set to ${theme}`);
                }}
                type="button"
              >
                {theme}
              </button>
            ))}
          </div>
        </Panel>

        <Panel
          eyebrow="Project defaults"
          title="New project preferences"
          description="Used when you start a project without selecting a template."
        >
          <div className="form-grid">
            <label className="field">
              <span>Voltage domain</span>
              <select
                className="field__control"
                onChange={(event) =>
                  updateSetting(
                    "defaultVoltageDomain",
                    event.target.value as (typeof voltageDomains)[number]
                  )
                }
                value={settings.defaultVoltageDomain}
              >
                {voltageDomains.map((domain) => (
                  <option key={domain} value={domain}>
                    {domain}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Output target</span>
              <select
                className="field__control"
                onChange={(event) =>
                  updateSetting(
                    "defaultOutputTarget",
                    event.target.value as (typeof outputTargets)[number]
                  )
                }
                value={settings.defaultOutputTarget}
              >
                {outputTargets.map((target) => (
                  <option key={target} value={target}>
                    {target}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </Panel>

        <Panel
          eyebrow="Workspace"
          title="Behavior"
          description="Toggles that change how the editor feels day-to-day."
        >
          <ul className="list-reset stack-sm">
            <li className="inspector-row">
              <div>
                <strong>Auto-save</strong>
                <span>
                  Save project changes automatically as you edit signals and
                  pins.
                </span>
              </div>
              <label className="field field--inline">
                <input
                  checked={settings.autoSave}
                  onChange={(event) =>
                    updateSetting("autoSave", event.target.checked)
                  }
                  type="checkbox"
                />
                <span>{settings.autoSave ? "On" : "Off"}</span>
              </label>
            </li>
            <li className="inspector-row">
              <div>
                <strong>Inspector panel</strong>
                <span>
                  Show the inspector pane on the right of the workspace.
                </span>
              </div>
              <label className="field field--inline">
                <input
                  checked={settings.showInspector}
                  onChange={(event) =>
                    updateSetting("showInspector", event.target.checked)
                  }
                  type="checkbox"
                />
                <span>{settings.showInspector ? "Visible" : "Hidden"}</span>
              </label>
            </li>
            <li className="inspector-row">
              <div>
                <strong>Pretty-print exports</strong>
                <span>Format exported JSON for human readability.</span>
              </div>
              <label className="field field--inline">
                <input
                  checked={settings.exportPretty}
                  onChange={(event) =>
                    updateSetting("exportPretty", event.target.checked)
                  }
                  type="checkbox"
                />
                <span>{settings.exportPretty ? "On" : "Off"}</span>
              </label>
            </li>
          </ul>
        </Panel>

        <div className="form-actions">
          <Button onClick={handleReset} type="button" variant="ghost">
            Reset to defaults
          </Button>
        </div>
      </div>
    </AppScaffold>
  );
}
