import { AssessWizard } from "@/components/assess/AssessWizard";

export const metadata = {
  title: "开始测评 · PEROT",
  description: "五个部分建立球员画像，用于生成可解释的篮球鞋推荐。",
};

export default function AssessPage() {
  return <AssessWizard />;
}
