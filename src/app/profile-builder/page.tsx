import { AssessWizard } from "@/components/assess/AssessWizard";

export const metadata = {
  title: "用户画像 · PEROT",
  description: "五个部分建立球员画像，生成可解释的篮球鞋推荐。",
};

export default function ProfileBuilderPage() {
  return <AssessWizard />;
}