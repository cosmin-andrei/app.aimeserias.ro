import type { Metadata } from "next";
import { MyPublicProfileView } from "../MyPublicProfileView";

export const metadata: Metadata = {
    title: "Profilul meu public",
};

export default function MyPublicProfilePage() {
    return <MyPublicProfileView />;
}
