<% if (part === 'file_import') {%><%
    if (hasDate) {%>
import { NgbModule, NgbDateParserFormatter } from '@ng-bootstrap/ng-bootstrap';
import { MraNgbDateFormatterService } from './<%-moduleName%>.directive';<%
    }%><%
} else if (part === 'module_import') {%><%
    if (hasDate) {%>
NgbModule,<%
    }%><%
} else if (part === 'module_provider') {%><%
    if (hasDate) {%>
{ provide: NgbDateParserFormatter, useClass: MraNgbDateFormatterService },<%
    }%><%
}%>