import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button, Card, CardBody } from "@nextui-org/react";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="glass max-w-md">
        <CardBody className="text-center p-8">
          <h1 className="mb-4 text-6xl font-bold gradient-text">404</h1>
          <p className="mb-6 text-xl text-muted-foreground">Oops! Page not found</p>
          <Button 
            as="a" 
            href="/" 
            color="primary"
            startContent={<Home className="h-4 w-4" />}
          >
            Return to Home
          </Button>
        </CardBody>
      </Card>
    </div>
  );
};

export default NotFound;
