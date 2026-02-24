import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@nextui-org/react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4 bg-background">
          <h1 className="text-xl font-semibold">Something went wrong</h1>
          <p className="text-muted-foreground text-sm text-center max-w-md">
            The page encountered an error. Try refreshing.
          </p>
          <Button
            color="primary"
            onPress={() => {
              this.setState({ hasError: false, error: null });
              window.location.href = "/";
            }}
          >
            Go to home
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
