import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
export const metadata: Metadata={metadataBase:new URL("https://www.areejattar.in"),title:{default:"AREEJ | The Art of Concentrated Fragrance",template:"%s | AREEJ"},description:"Discover AREEJ attars and perfumes inspired by Indian, Middle Eastern and global fragrance traditions.",keywords:["AREEJ","attar","perfume","oud","Indian attar","Arabic fragrance","concentrated fragrance"],openGraph:{title:"AREEJ | The Art of Concentrated Fragrance",description:"Explore the AREEJ fragrance catalogue.",url:"https://www.areejattar.in",siteName:"AREEJ",type:"website"},robots:{index:true,follow:true},icons:{icon:"/images/icon.png",apple:"/images/icon.png"}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><Header/>{children}<WhatsAppButton/><Footer/></body></html>}
