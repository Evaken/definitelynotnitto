import type { ScreenId } from '../nav/screens.js';
interface PlaceholderScreenProps {
    screen: ScreenId;
    summary: string;
}
/**
 * A screen that exists but is not built yet.
 *
 * It says which stage fills it in, so the app is honest about what works rather
 * than showing a convincing but dead interface.
 */
export declare function PlaceholderScreen({ screen, summary }: PlaceholderScreenProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=PlaceholderScreen.d.ts.map